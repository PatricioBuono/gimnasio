package com.gimnasio.controlador;

import com.gimnasio.dto.ActividadRequest;
import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.servicio.ActividadServicio;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/actividades")
@PreAuthorize("hasRole('ADMIN')")
public class ActividadControlador {

  private final ActividadServicio servicio;

  public ActividadControlador(ActividadServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<ActividadResponse> listar() {
    return servicio.listar();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ActividadResponse crear(@Valid @RequestBody ActividadRequest request) {
    return servicio.crear(request);
  }

  @PutMapping("/{id}")
  public ActividadResponse editar(@PathVariable Integer id, @Valid @RequestBody ActividadRequest request) {
    return servicio.editar(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable Integer id) {
    servicio.eliminar(id);
  }

  @PatchMapping("/{id}/inhabilitar")
  public ActividadResponse inhabilitar(@PathVariable Integer id) {
    return servicio.inhabilitar(id);
  }

  @PatchMapping("/{id}/habilitar")
  public ActividadResponse habilitar(@PathVariable Integer id) {
    return servicio.habilitar(id);
  }
}
