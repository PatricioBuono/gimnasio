package com.gimnasio.controlador;

import com.gimnasio.dto.ComprobanteResponse;
import com.gimnasio.dto.PagoRequest;
import com.gimnasio.dto.VistaPreviaResponse;
import com.gimnasio.servicio.PagoServicio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pagos")
@PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
public class PagoControlador {

  private final PagoServicio servicio;

  public PagoControlador(PagoServicio servicio) {
    this.servicio = servicio;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ComprobanteResponse registrar(@Valid @RequestBody PagoRequest request, Authentication auth) {
    return servicio.registrar(request, auth.getName());
  }

  @GetMapping("/vista-previa")
  public VistaPreviaResponse vistaPrevia(@RequestParam Integer socioId,
      @RequestParam @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])") String periodo) {
    return servicio.vistaPrevia(socioId, periodo);
  }
}
