package com.gimnasio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SocioRequest(
    @NotBlank @Pattern(regexp = "[0-9. ]+", message = "DNI con formato inválido") String dni,
    @NotBlank String nombre,
    @NotBlank String apellido) {
}
