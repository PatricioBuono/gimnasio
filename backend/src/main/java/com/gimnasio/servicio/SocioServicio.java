package com.gimnasio.servicio;

import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.dto.AsignacionRequest;
import com.gimnasio.dto.FichaSocioResponse;
import com.gimnasio.dto.SocioRequest;
import com.gimnasio.dto.SocioResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.EstadoActividad;
import com.gimnasio.entidad.Socio;
import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.excepcion.ConflictoException;
import com.gimnasio.excepcion.RecursoNoEncontradoException;
import com.gimnasio.excepcion.SolicitudInvalidaException;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocioServicio {

  private final SocioRepositorio socios;
  private final ActividadRepositorio actividades;
  private final SocioActividadRepositorio asignaciones;
  private final Clock reloj;

  public SocioServicio(SocioRepositorio socios, ActividadRepositorio actividades,
      SocioActividadRepositorio asignaciones, Clock reloj) {
    this.socios = socios;
    this.actividades = actividades;
    this.asignaciones = asignaciones;
    this.reloj = reloj;
  }

  @Transactional
  public SocioResponse alta(SocioRequest request) {
    String dni = normalizarDni(request.dni());
    String nombre = obligatorio(request.nombre(), "El nombre es obligatorio").trim();
    String apellido = obligatorio(request.apellido(), "El apellido es obligatorio").trim();
    if (socios.existsByDni(dni)) {
      throw new ConflictoException("El DNI ya está registrado");
    }
    Socio guardado = socios.save(new Socio(dni, nombre, apellido, OffsetDateTime.now(reloj)));
    return new SocioResponse(guardado.getId(), guardado.getDni(), guardado.getNombre(), guardado.getApellido());
  }

  @Transactional
  public FichaSocioResponse asignarActividades(Integer socioId, AsignacionRequest request) {
    Socio socio = socios.findById(socioId)
        .orElseThrow(() -> new RecursoNoEncontradoException("Socio no encontrado"));
    Set<Integer> ids = new LinkedHashSet<>(request.actividadIds());
    List<Actividad> seleccionadas = new ArrayList<>();
    for (Integer id : ids) {
      Actividad actividad = actividades.findById(id)
          .orElseThrow(() -> new RecursoNoEncontradoException("Actividad no encontrada: " + id));
      if (actividad.getEstado() != EstadoActividad.ACTIVA) {
        throw new SolicitudInvalidaException("La actividad no está activa: " + actividad.getNombre());
      }
      seleccionadas.add(actividad);
    }
    asignaciones.deleteBySocioId(socioId);
    for (Actividad actividad : seleccionadas) {
      asignaciones.save(new SocioActividad(socio.getId(), actividad.getId()));
    }
    return ficha(socio, seleccionadas);
  }

  @Transactional(readOnly = true)
  public FichaSocioResponse ficha(Integer socioId) {
    Socio socio = socios.findById(socioId)
        .orElseThrow(() -> new RecursoNoEncontradoException("Socio no encontrado"));
    List<Actividad> vinculadas = asignaciones.findBySocioId(socioId).stream()
        .map(a -> actividades.findById(a.getActividadId())
            .orElseThrow(() -> new RecursoNoEncontradoException("Actividad no encontrada")))
        .toList();
    return ficha(socio, vinculadas);
  }

  private String normalizarDni(String dni) {
    if (dni == null) {
      throw new SolicitudInvalidaException("El DNI es obligatorio");
    }
    String limpio = dni.replace(".", "").replace(" ", "");
    if (limpio.isEmpty() || !limpio.matches("[0-9]+")) {
      throw new SolicitudInvalidaException("DNI con formato inválido");
    }
    return limpio;
  }

  private String obligatorio(String valor, String mensaje) {
    if (valor == null || valor.trim().isEmpty()) {
      throw new SolicitudInvalidaException(mensaje);
    }
    return valor;
  }

  private FichaSocioResponse ficha(Socio socio, List<Actividad> vinculadas) {
    List<ActividadResponse> items = vinculadas.stream()
        .map(a -> new ActividadResponse(a.getId(), a.getNombre(), a.getDescripcion(), a.getEstado().name()))
        .toList();
    return new FichaSocioResponse(socio.getId(), socio.getDni(), socio.getNombre(), socio.getApellido(), items);
  }
}
