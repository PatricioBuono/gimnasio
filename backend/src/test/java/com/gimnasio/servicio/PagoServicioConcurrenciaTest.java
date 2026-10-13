package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.PagoRequest;
import com.gimnasio.entidad.Comprobante;
import com.gimnasio.entidad.MetodoPago;
import com.gimnasio.entidad.Pago;
import com.gimnasio.entidad.ParametroPrecio;
import com.gimnasio.entidad.Socio;
import com.gimnasio.entidad.Usuario;
import com.gimnasio.repositorio.ComprobanteRepositorio;
import com.gimnasio.repositorio.FeriadoRepositorio;
import com.gimnasio.repositorio.PagoRepositorio;
import com.gimnasio.repositorio.ParametroPrecioRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import com.gimnasio.repositorio.UsuarioRepositorio;
import com.gimnasio.util.FechaService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PagoServicioConcurrenciaTest {

  private static final ZoneId ZONA = ZoneId.of("America/Argentina/Mendoza");

  @Mock
  private PagoRepositorio pagos;
  @Mock
  private ComprobanteRepositorio comprobantes;
  @Mock
  private SocioRepositorio socios;
  @Mock
  private UsuarioRepositorio usuarios;
  @Mock
  private ParametroPrecioRepositorio parametros;
  @Mock
  private FeriadoRepositorio feriados;

  private PagoServicio servicio;
  private Usuario cobrador;

  @BeforeEach
  void setup() {
    Clock reloj = Clock.fixed(Instant.parse("2026-10-05T15:00:00Z"), ZONA);
    servicio = new PagoServicio(pagos, comprobantes, socios, usuarios, parametros, feriados,
        new FechaService(reloj), reloj);
    cobrador = new Usuario("recep", "x", "RECEPCIONISTA");
    when(usuarios.findByUsername("recep")).thenReturn(Optional.of(cobrador));
    when(socios.existsById(1)).thenReturn(true);
  }

  @Test
  void duplicadoSecuencial_bloquea409() {
    when(pagos.existsBySocioIdAndPeriodo(1, "2026-10")).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> servicio
        .registrar(new PagoRequest(1, "2026-10", MetodoPago.EFECTIVO, false, null), "recep"));
    assertEquals(409, e.getStatusCode().value());
  }

  @Test
  void violacionDeConstraint_enCarrera_mapea409() throws Exception {
    when(parametros.findById(ParametroPrecio.CUOTA))
        .thenReturn(Optional.of(new ParametroPrecio("CUOTA", new BigDecimal("10000"), OffsetDateTime.now())));
    when(parametros.findById(ParametroPrecio.RECARGO_SEMANAL))
        .thenReturn(Optional.of(new ParametroPrecio("RECARGO_SEMANAL", new BigDecimal("500"), OffsetDateTime.now())));
    when(feriados.findAll()).thenReturn(List.of());
    when(comprobantes.siguienteNumero()).thenReturn(1L);
    when(comprobantes.save(any())).thenAnswer(i -> {
      Comprobante c = i.getArgument(0);
      c.setNro(1L);
      return c;
    });
    when(pagos.existsBySocioIdAndPeriodo(1, "2026-07")).thenReturn(false);
    AtomicInteger intentos = new AtomicInteger();
    when(pagos.save(any())).thenAnswer(i -> {
      if (intentos.incrementAndGet() > 1) {
        throw new DataIntegrityViolationException("UNIQUE(socio_id, periodo)");
      }
      Pago p = i.getArgument(0);
      return p;
    });

    ExecutorService pool = Executors.newFixedThreadPool(8);
    List<Callable<Integer>> tareas = new ArrayList<>();
    for (int i = 0; i < 8; i++) {
      tareas.add(() -> {
        try {
          servicio.registrar(new PagoRequest(1, "2026-07", MetodoPago.EFECTIVO, false, null), "recep");
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
  }
}
