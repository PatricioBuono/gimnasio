package com.gimnasio.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AsignacionRequest(
    @NotNull List<Integer> actividadIds) {
}
