package com.gimnasio.dto;

import java.time.LocalDate;
import java.util.List;

public record SocioEstadoResponse(
    Integer id,
    String dni,
    String nombre,
    String apellido,
    List<ActividadResponse> actividades,
    EstadoSocio estado,
    long diasAtraso,
    LocalDate fechaLimite) {
}
