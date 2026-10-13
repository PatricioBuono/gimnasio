package com.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record FeriadoRequest(
    @NotNull LocalDate fecha,
    @NotBlank String descripcion) {
}
