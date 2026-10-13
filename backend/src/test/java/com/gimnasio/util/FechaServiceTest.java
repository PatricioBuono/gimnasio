package com.gimnasio.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;
import org.junit.jupiter.api.Test;

class FechaServiceTest {

  private static final ZoneId ZONA = ZoneId.of("America/Argentina/Mendoza");

  private FechaService servicio(String instanteFijo) {
    return new FechaService(Clock.fixed(Instant.parse(instanteFijo), ZONA));
  }

  @Test
  void limite_dia10Habil_esEl10() {
    FechaService s = servicio("2026-09-05T12:00:00Z");
    assertEquals(LocalDate.of(2026, 9, 10), s.fechaLimite(2026, 9, Set.of()));
  }

  @Test
  void limite_dia10Sabado_pasaAlLunes12() {
    FechaService s = servicio("2026-10-05T12:00:00Z");
    assertEquals(LocalDate.of(2026, 10, 12), s.fechaLimite(2026, 10, Set.of()));
  }

  @Test
  void limite_dia10Domingo_pasaAlLunes11() {
    FechaService s = servicio("2026-05-05T12:00:00Z");
    assertEquals(LocalDate.of(2026, 5, 11), s.fechaLimite(2026, 5, Set.of()));
  }

  @Test
  void limite_dia10Feriado_pasaAlDia11() {
    FechaService s = servicio("2026-09-05T12:00:00Z");
    assertEquals(LocalDate.of(2026, 9, 11),
        s.fechaLimite(2026, 9, Set.of(LocalDate.of(2026, 9, 10))));
  }

  @Test
  void limite_feriadoYLunesFeriado_pasaAlMartes() {
    FechaService s = servicio("2026-10-05T12:00:00Z");
    Set<LocalDate> feriados = Set.of(LocalDate.of(2026, 10, 12));
    assertEquals(LocalDate.of(2026, 10, 13), s.fechaLimite(2026, 10, feriados));
  }

  @Test
  void diasAtraso_enTermino_esCero() {
    FechaService s = servicio("2026-10-05T12:00:00Z");
    assertEquals(0, s.diasAtraso(LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 12)));
    assertEquals(0, s.diasAtraso(LocalDate.of(2026, 10, 12), LocalDate.of(2026, 10, 12)));
  }

  @Test
  void semanas_bordes_1_7_8_14_15_21_22() {
    FechaService s = servicio("2026-10-05T12:00:00Z");
    assertEquals(0, s.semanasAtraso(0));
    assertEquals(1, s.semanasAtraso(1));
    assertEquals(1, s.semanasAtraso(7));
    assertEquals(2, s.semanasAtraso(8));
    assertEquals(2, s.semanasAtraso(14));
    assertEquals(3, s.semanasAtraso(15));
    assertEquals(3, s.semanasAtraso(21));
    assertEquals(4, s.semanasAtraso(22));
  }

  @Test
  void recargo_multiplicaSemanasPorValor() {
    FechaService s = servicio("2026-10-05T12:00:00Z");
    assertEquals(new BigDecimal("1000"), s.calcularRecargo(8, new BigDecimal("500")));
    assertEquals(BigDecimal.ZERO, s.calcularRecargo(0, new BigDecimal("500")));
  }

  @Test
  void hoy_respetaRelojFijo() {
    FechaService s = servicio("2026-10-14T15:00:00Z");
    assertEquals(LocalDate.of(2026, 10, 14), s.hoy());
  }
}
