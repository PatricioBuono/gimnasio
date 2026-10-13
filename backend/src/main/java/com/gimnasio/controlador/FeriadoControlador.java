package com.gimnasio.controlador;

import com.gimnasio.dto.FeriadoRequest;
import com.gimnasio.dto.FeriadoResponse;
import com.gimnasio.servicio.FeriadoServicio;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/feriados")
@PreAuthorize("hasRole('ADMIN')")
public class FeriadoControlador {

  private final FeriadoServicio servicio;

  public FeriadoControlador(FeriadoServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<FeriadoResponse> listar() {
    return servicio.listar();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public FeriadoResponse crear(@Valid @RequestBody FeriadoRequest request) {
    return servicio.crear(request);
  }

  @PutMapping("/{fecha}")
  public FeriadoResponse editar(@PathVariable LocalDate fecha, @Valid @RequestBody FeriadoRequest request) {
    return servicio.editar(new FeriadoRequest(fecha, request.descripcion()));
  }

  @DeleteMapping("/{fecha}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable LocalDate fecha) {
    servicio.eliminar(fecha);
  }
}
