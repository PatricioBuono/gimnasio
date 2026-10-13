package com.gimnasio.dto;

public record ActividadResponse(
    Integer id,
    String nombre,
    String descripcion,
    String estado) {
}
