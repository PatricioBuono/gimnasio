package com.gimnasio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ComprobanteResponse(
    String numero,
    Integer socioId,
    String periodo,
    BigDecimal cuota,
    long semanas,
    BigDecimal recargo,
    BigDecimal total,
    String metodo,
    String etiqueta,
    LocalDate fechaLimite) {

  private static final String PREFIJO_SUCURSAL = "0001";

  /** Formatea el número de secuencia crudo. El formato pertenece a la presentación, no al dominio. */
  public static ComprobanteResponse de(Long nro, Integer socioId, String periodo, BigDecimal cuota,
      long semanas, BigDecimal recargo, BigDecimal total, String metodo, String etiqueta,
      LocalDate fechaLimite) {
    return new ComprobanteResponse(formatear(nro), socioId, periodo, cuota, semanas, recargo, total,
        metodo, etiqueta, fechaLimite);
  }

  private static String formatear(Long nro) {
    return PREFIJO_SUCURSAL + "-" + String.format("%08d", nro);
  }
}
