package com.gimnasio.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PrecioRequest(
    @NotNull BigDecimal valor) {
}
