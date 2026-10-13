package com.gimnasio.dto;

import java.util.List;

public record FichaSocioResponse(
    Integer id,
    String dni,
    String nombre,
    String apellido,
    List<ActividadResponse> actividades) {
}
