package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.PrecioResponse;
import com.gimnasio.entidad.ParametroPrecio;
import com.gimnasio.repositorio.ParametroPrecioRepositorio;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PrecioServicioTest {

  @Mock
  private ParametroPrecioRepositorio parametros;

  private PrecioServicio servicio;

  @BeforeEach
  void setup() {
    servicio = new PrecioServicio(parametros,
        Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"), ZoneId.of("America/Argentina/Mendoza")));
  }

  @Test
  void actualizarCuota_montoPositivo_actualiza() {
    ParametroPrecio p = new ParametroPrecio("CUOTA", new BigDecimal("1.00"), OffsetDateTime.now());
    when(parametros.findById("CUOTA")).thenReturn(Optional.of(p));

    PrecioResponse r = servicio.actualizarCuota(new BigDecimal("15000.50"));

    assertEquals(new BigDecimal("15000.50"), r.valor());
  }

  @Test
  void actualizarCuota_ceroNegativoNulo_bloquea400() {
    for (BigDecimal v : new BigDecimal[]{null, BigDecimal.ZERO, new BigDecimal("-1")}) {
      ResponseStatusException e = assertThrows(ResponseStatusException.class,
          () -> servicio.actualizarCuota(v));
      assertEquals(400, e.getStatusCode().value());
    }
    verify(parametros, never()).findById("CUOTA");
  }

  @Test
  void actualizarRecargo_ceroOPostivo_actualiza() {
    ParametroPrecio p = new ParametroPrecio("RECARGO_SEMANAL", BigDecimal.ZERO, OffsetDateTime.now());
    when(parametros.findById("RECARGO_SEMANAL")).thenReturn(Optional.of(p));

    assertEquals(BigDecimal.ZERO, servicio.actualizarRecargo(BigDecimal.ZERO).valor());
    assertEquals(new BigDecimal("500"), servicio.actualizarRecargo(new BigDecimal("500")).valor());
  }

  @Test
  void actualizarRecargo_negativoONulo_bloquea400() {
    for (BigDecimal v : new BigDecimal[]{null, new BigDecimal("-0.01")}) {
      ResponseStatusException e = assertThrows(ResponseStatusException.class,
          () -> servicio.actualizarRecargo(v));
      assertEquals(400, e.getStatusCode().value());
    }
  }
}
