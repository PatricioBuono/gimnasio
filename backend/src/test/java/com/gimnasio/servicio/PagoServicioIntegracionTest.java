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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
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
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  @DynamicPropertySource
  static void propiedades(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url",
        () -> postgres.getJdbcUrl() + "?options=-c%20TimeZone%3DAmerica/Argentina/Mendoza");
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

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
    Clock relojFijo() {
      return Clock.fixed(Instant.parse("2026-10-05T15:00:00Z"), ZONA);
    }
  }

  @Autowired
  private PagoServicio servicio;
  @Autowired
  private com.gimnasio.servicio.SocioEstadoServicio estados;
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

  @Test
  void dashboard_separaYOrdenaPorDiasDesc() {
    Integer viejo = alta("77000001", "Viejo", "Mora", "2026-01-05T12:00:00-03:00");
    Integer reciente = alta("77000002", "Reciente", "Mora", "2026-05-05T12:00:00-03:00");
    Integer alDia = alta("77000003", "AlDia", "Ok", "2026-09-01T12:00:00-03:00");
    servicio.registrar(new PagoRequest(viejo, "2026-06", MetodoPago.EFECTIVO, false, null), "admin");
    servicio.registrar(new PagoRequest(reciente, "2026-08", MetodoPago.EFECTIVO, false, null), "admin");
    servicio.registrar(new PagoRequest(alDia, "2026-09", MetodoPago.EFECTIVO, false, null), "admin");

    var dashboard = estados.dashboard();
    var morosos = dashboard.conDeuda();
    long anterior = Long.MAX_VALUE;
    for (var m : morosos) {
      assertTrue(m.diasAtraso() <= anterior, "Morosos no ordenados DESC");
      anterior = m.diasAtraso();
    }
    assertEquals(87, estados.buscar("77000001").get(0).diasAtraso());
    assertEquals(25, estados.buscar("77000002").get(0).diasAtraso());
    assertTrue(dashboard.alDia().stream().anyMatch(s -> s.dni().equals("77000003")));
  }

  @Test
  void buscar_porDniExactoYPOrNombre() {
    alta("77123456", "PruebaBusqueda", "Unica", "2026-09-01T12:00:00-03:00");

    var porDni = estados.buscar("77.123.456");
    assertEquals(1, porDni.size());
    assertEquals("PruebaBusqueda", porDni.get(0).nombre());

    var porNombre = estados.buscar("pruebabusqueda");
    assertTrue(porNombre.stream().anyMatch(s -> s.dni().equals("77123456")));

    assertTrue(estados.buscar("zzzznada").isEmpty());
    assertTrue(estados.buscar("   ").isEmpty());
  }

  @Test
  void dashboard_limitaMorososA20() {
    for (int i = 0; i < 21; i++) {
      alta("88000" + i, "Moroso" + i, "Lote", "2026-01-05T12:00:00-03:00");
    }

    assertEquals(20, estados.dashboard().conDeuda().size());
  }

  private Integer alta(String dni, String nombre, String apellido, String creadoEn) {
    return socios.save(new Socio(dni, nombre, apellido, OffsetDateTime.parse(creadoEn))).getId();
  }
}
