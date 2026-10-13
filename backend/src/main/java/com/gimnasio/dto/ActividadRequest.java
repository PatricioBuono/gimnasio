package com.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;

public record ActividadRequest(
    @NotBlank String nombre,
    String descripcion) {
}
