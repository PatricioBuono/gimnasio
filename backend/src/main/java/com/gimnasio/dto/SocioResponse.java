package com.gimnasio.dto;

public record SocioResponse(
    Integer id,
    String dni,
    String nombre,
    String apellido) {
}
