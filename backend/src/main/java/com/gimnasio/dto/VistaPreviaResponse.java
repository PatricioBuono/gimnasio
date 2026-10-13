package com.gimnasio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VistaPreviaResponse(
    BigDecimal cuota,
    LocalDate fechaLimite,
    long diasAtraso,
    long semanas,
    BigDecimal recargo,
    BigDecimal total) {
}
