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
}
