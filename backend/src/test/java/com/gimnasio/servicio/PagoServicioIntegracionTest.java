package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.gimnasio.dto.ComprobanteResponse;
import com.gimnasio.dto.PagoRequest;
import com.gimnasio.entidad.MetodoPago;
import com.gimnasio.entidad.ParametroPrecio;
import com.gimnasio.entidad.Socio;
import com.gimnasio.repositorio.ComprobanteRepositorio;
import com.gimnasio.repositorio.PagoRepositorio;
import com.gimnasio.repositorio.ParametroPrecioRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
@EnabledIf("dockerDisponible")
@TestPropertySource(properties = "app.jwt.secreto=test-secreto-minimo-32-caracteres-1234")
class PagoServicioIntegracionTest {

  private static final ZoneId ZONA = ZoneId.of("America/Argentina/Mendoza");

  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  static boolean dockerDisponible() {
    try {
      org.testcontainers.DockerClientFactory.instance().client().pingCmd().exec();
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  @TestConfiguration(proxyBeanMethods = false)
  static class RelojFijo {
    @Bean
    @Primary
    Clock reloj() {
      return Clock.fixed(Instant.parse("2026-10-05T15:00:00Z"), ZONA);
    }
  }

  @Autowired
  private PagoServicio servicio;
  @Autowired
  private SocioRepositorio socios;
  @Autowired
  private ParametroPrecioRepositorio parametros;
  @Autowired
  private PagoRepositorio pagos;
  @Autowired
  private ComprobanteRepositorio comprobantes;

  private Integer socioId;

  @BeforeEach
  void setup() {
    Socio socio = socios.save(new Socio("90000" + Math.abs(System.nanoTime() % 100000), "Test", "IT",
        OffsetDateTime.now()));
    socioId = socio.getId();
    guardarParametro(ParametroPrecio.CUOTA, new BigDecimal("10000"));
    guardarParametro(ParametroPrecio.RECARGO_SEMANAL, new BigDecimal("500"));
  }

  @Test
  void pagoEnTermino_sinRecargo() {
    ComprobanteResponse r = servicio.registrar(
        new PagoRequest(socioId, "2026-10", MetodoPago.EFECTIVO, false, null), "admin");

    assertEquals(new BigDecimal("10000.00"), r.cuota().setScale(2));
    assertEquals(0, r.semanas());
    assertEquals(0, r.recargo().compareTo(BigDecimal.ZERO));
    assertEquals(0, r.total().compareTo(new BigDecimal("10000")));
    assertNull(r.etiqueta());
    assertTrue(r.numero().matches("0001-\\d{8}"));
  }

  @Test
  void pagoConMora_calculaSemanas() {
    ComprobanteResponse r = servicio.registrar(
        new PagoRequest(socioId, "2026-09", MetodoPago.TRANSFERENCIA, false, null), "admin");

    assertEquals(4, r.semanas());
    assertEquals(0, r.recargo().compareTo(new BigDecimal("2000")));
    assertEquals(0, r.total().compareTo(new BigDecimal("12000")));
  }

  @Test
  void pagoDuplicado_bloquea409() {
    servicio.registrar(new PagoRequest(socioId, "2026-10", MetodoPago.EFECTIVO, false, null), "admin");

    ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> servicio
        .registrar(new PagoRequest(socioId, "2026-10", MetodoPago.EFECTIVO, false, null), "admin"));
    assertEquals(409, e.getStatusCode().value());
  }

  @Test
  void pagosConcurrentes_soloUnoTieneExito() throws Exception {
    int comprobantesAntes = comprobantes.findAll().size();
    ExecutorService pool = Executors.newFixedThreadPool(8);
    List<Callable<Integer>> tareas = new ArrayList<>();
    for (int i = 0; i < 8; i++) {
      tareas.add(() -> {
        try {
          servicio.registrar(new PagoRequest(socioId, "2026-07", MetodoPago.EFECTIVO, false, null), "admin");
          return 201;
        } catch (ResponseStatusException e) {
          return e.getStatusCode().value();
        }
      });
    }
    List<Future<Integer>> resultados = pool.invokeAll(tareas);
    pool.shutdown();

    long exitos = 0;
    long conflictos = 0;
    for (Future<Integer> f : resultados) {
      if (f.get() == 201) {
        exitos++;
      } else if (f.get() == 409) {
        conflictos++;
      }
    }
    assertEquals(1, exitos);
    assertEquals(7, conflictos);
    assertTrue(pagos.findBySocioIdAndPeriodo(socioId, "2026-07").isPresent());
    assertEquals(1, comprobantes.findAll().size() - comprobantesAntes);
  }

  @Test
  void exoneracion_conMotivo_recargoCeroConAuditoria() {
    ComprobanteResponse r = servicio.registrar(
        new PagoRequest(socioId, "2026-08", MetodoPago.EFECTIVO, true, "  Retoma tras inactividad  "), "admin");

    assertEquals(0, r.recargo().compareTo(BigDecimal.ZERO));
    assertEquals(0, r.total().compareTo(new BigDecimal("10000")));
    assertEquals("Recargo Bonificado", r.etiqueta());

    var pago = pagos.findBySocioIdAndPeriodo(socioId, "2026-08").orElseThrow();
    assertTrue(pago.isExonerado());
    assertEquals("Retoma tras inactividad", pago.getMotivoExoneracion());
    assertTrue(pago.getExoneradoPor() != null);
    assertTrue(pago.getExoneradoAt() != null);

    var comprobante = comprobantes.findByPagoId(pago.getId()).orElseThrow();
    assertEquals("Recargo Bonificado", comprobante.getEtiqueta());
  }

  @Test
  void exoneracion_sinMotivo_bloquea400() {
    ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> servicio
        .registrar(new PagoRequest(socioId, "2026-08", MetodoPago.EFECTIVO, true, "   "), "admin"));
    assertEquals(400, e.getStatusCode().value());
  }

  private void guardarParametro(String clave, BigDecimal valor) {
    ParametroPrecio p = parametros.findById(clave).orElseThrow();
    p.setValor(valor);
    parametros.save(p);
  }
}
