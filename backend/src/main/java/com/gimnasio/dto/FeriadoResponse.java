package com.gimnasio.dto;

import java.time.LocalDate;

public record FeriadoResponse(
    LocalDate fecha,
    String descripcion) {
}
