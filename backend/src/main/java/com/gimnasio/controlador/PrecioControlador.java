package com.gimnasio.controlador;

import com.gimnasio.dto.PrecioRequest;
import com.gimnasio.dto.PrecioResponse;
import com.gimnasio.servicio.PrecioServicio;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/precios")
@PreAuthorize("hasRole('ADMIN')")
public class PrecioControlador {

  private final PrecioServicio servicio;

  public PrecioControlador(PrecioServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<PrecioResponse> listar() {
    return servicio.listar();
  }

  @PutMapping("/cuota")
  public PrecioResponse actualizarCuota(@Valid @RequestBody PrecioRequest request) {
    return servicio.actualizarCuota(request.valor());
  }

  @PutMapping("/recargo")
  public PrecioResponse actualizarRecargo(@Valid @RequestBody PrecioRequest request) {
    return servicio.actualizarRecargo(request.valor());
  }
}
