package com.gimnasio.dto;

import java.math.BigDecimal;

public record PrecioResponse(
    String clave,
    BigDecimal valor) {
}
