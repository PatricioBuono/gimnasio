package com.gimnasio.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ComprobanteResponseTest {

  @Test
  void de_formateaSecuenciaConPrefijoSucursalYCerosIzquierda() {
    ComprobanteResponse r = ComprobanteResponse.de(1L, 7, "2026-10", new BigDecimal("10000"), 2,
        new BigDecimal("1000"), new BigDecimal("11000"), "EFECTIVO", null,
        LocalDate.of(2026, 10, 12));

    assertEquals("0001-00000001", r.numero());
    assertEquals(7, r.socioId());
  }

  @Test
  void de_conservaLaSecuenciaCrudaSinPerderDigitos() {
    ComprobanteResponse r = ComprobanteResponse.de(123456789L, 1, "2026-10", BigDecimal.ZERO, 0,
        BigDecimal.ZERO, BigDecimal.ZERO, "EFECTIVO", null, LocalDate.of(2026, 10, 12));

    assertEquals("0001-123456789", r.numero());
  }
}
