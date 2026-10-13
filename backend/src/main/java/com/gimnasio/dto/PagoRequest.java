package com.gimnasio.dto;

import com.gimnasio.entidad.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PagoRequest(
    @NotNull Integer socioId,
    @NotNull @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])", message = "Período con formato inválido (AAAA-MM)") String periodo,
    @NotNull MetodoPago metodo,
    boolean exonerado,
    String motivo) {
}
