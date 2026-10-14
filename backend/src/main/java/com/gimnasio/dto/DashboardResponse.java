package com.gimnasio.dto;

import java.util.List;

public record DashboardResponse(
    List<SocioEstadoResponse> alDia,
    List<SocioEstadoResponse> conDeuda) {
}
