package com.gimnasio.servicio;

import com.gimnasio.dto.FeriadoRequest;
import com.gimnasio.dto.FeriadoResponse;
import com.gimnasio.entidad.Feriado;
import com.gimnasio.excepcion.ConflictoException;
import com.gimnasio.excepcion.RecursoNoEncontradoException;
import com.gimnasio.repositorio.FeriadoRepositorio;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeriadoServicio {

  private final FeriadoRepositorio feriados;

  public FeriadoServicio(FeriadoRepositorio feriados) {
    this.feriados = feriados;
  }

  @Transactional
  public FeriadoResponse crear(FeriadoRequest request) {
    if (feriados.existsById(request.fecha())) {
      throw new ConflictoException("La fecha ya está registrada como feriado");
    }
    Feriado guardado = feriados.save(new Feriado(request.fecha(), request.descripcion().trim()));
    return new FeriadoResponse(guardado.getFecha(), guardado.getDescripcion());
  }

  @Transactional
  public FeriadoResponse editar(FeriadoRequest request) {
    Feriado feriado = feriados.findById(request.fecha())
        .orElseThrow(() -> new RecursoNoEncontradoException("Feriado no encontrado"));
    feriado.setDescripcion(request.descripcion().trim());
    return new FeriadoResponse(feriado.getFecha(), feriado.getDescripcion());
  }

  @Transactional
  public void eliminar(java.time.LocalDate fecha) {
    if (!feriados.existsById(fecha)) {
      throw new RecursoNoEncontradoException("Feriado no encontrado");
    }
    feriados.deleteById(fecha);
  }

  @Transactional(readOnly = true)
  public List<FeriadoResponse> listar() {
    return feriados.findAll().stream()
        .map(f -> new FeriadoResponse(f.getFecha(), f.getDescripcion())).toList();
  }
}
