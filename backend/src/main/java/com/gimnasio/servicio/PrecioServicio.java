package com.gimnasio.servicio;

import com.gimnasio.dto.PrecioResponse;
import com.gimnasio.entidad.ParametroPrecio;
import com.gimnasio.repositorio.ParametroPrecioRepositorio;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PrecioServicio {

  private final ParametroPrecioRepositorio parametros;
  private final Clock reloj;

  public PrecioServicio(ParametroPrecioRepositorio parametros, Clock reloj) {
    this.parametros = parametros;
    this.reloj = reloj;
  }

  @Transactional(readOnly = true)
  public List<PrecioResponse> listar() {
    return parametros.findAll().stream()
        .map(p -> new PrecioResponse(p.getClave(), p.getValor())).toList();
  }

  @Transactional
  public PrecioResponse actualizarCuota(BigDecimal valor) {
    if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cuota debe ser mayor a 0");
    }
    return guardar(ParametroPrecio.CUOTA, valor);
  }

  @Transactional
  public PrecioResponse actualizarRecargo(BigDecimal valor) {
    if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El recargo debe ser mayor o igual a 0");
    }
    return guardar(ParametroPrecio.RECARGO_SEMANAL, valor);
  }

  private PrecioResponse guardar(String clave, BigDecimal valor) {
    ParametroPrecio parametro = parametros.findById(clave)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parámetro no encontrado"));
    parametro.setValor(valor);
    parametro.setActualizadoEn(OffsetDateTime.now(reloj));
    return new PrecioResponse(parametro.getClave(), parametro.getValor());
  }
}
