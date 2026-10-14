package com.gimnasio.controlador;

import com.gimnasio.dto.AsignacionRequest;
import com.gimnasio.dto.DashboardResponse;
import com.gimnasio.dto.FichaSocioResponse;
import com.gimnasio.dto.SocioEstadoResponse;
import com.gimnasio.dto.SocioRequest;
import com.gimnasio.dto.SocioResponse;
import com.gimnasio.servicio.SocioEstadoServicio;
import com.gimnasio.servicio.SocioServicio;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/socios")
@PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
public class SocioControlador {

  private final SocioServicio servicio;
  private final SocioEstadoServicio estados;

  public SocioControlador(SocioServicio servicio, SocioEstadoServicio estados) {
    this.servicio = servicio;
    this.estados = estados;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SocioResponse alta(@Valid @RequestBody SocioRequest request) {
    return servicio.alta(request);
  }

  @PutMapping("/{id}/actividades")
  public FichaSocioResponse asignar(@PathVariable Integer id, @Valid @RequestBody AsignacionRequest request) {
    return servicio.asignarActividades(id, request);
  }

  @GetMapping("/{id}")
  public FichaSocioResponse ficha(@PathVariable Integer id) {
    return servicio.ficha(id);
  }

  @GetMapping("/estado")
  public DashboardResponse estado() {
    return estados.dashboard();
  }

  @GetMapping("/buscar")
  public List<SocioEstadoResponse> buscar(@RequestParam(defaultValue = "") String q) {
    return estados.buscar(q);
  }
}
