package com.gimnasio.servicio;

import com.gimnasio.dto.ActividadRequest;
import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.EstadoActividad;
import com.gimnasio.excepcion.ConflictoException;
import com.gimnasio.excepcion.RecursoNoEncontradoException;
import com.gimnasio.excepcion.SolicitudInvalidaException;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActividadServicio {

  private final ActividadRepositorio actividades;
  private final SocioActividadRepositorio asignaciones;
  private final Clock reloj;

  public ActividadServicio(ActividadRepositorio actividades, SocioActividadRepositorio asignaciones, Clock reloj) {
    this.actividades = actividades;
    this.asignaciones = asignaciones;
    this.reloj = reloj;
  }

  @Transactional
  public ActividadResponse crear(ActividadRequest request) {
    String nombre = normalizar(request.nombre());
    if (actividades.existeConNombre(nombre, null)) {
      throw new ConflictoException("Ya existe una actividad con ese nombre");
    }
    Actividad guardada = actividades.save(new Actividad(nombre, request.descripcion(), OffsetDateTime.now(reloj)));
    return aResponse(guardada);
  }

  @Transactional
  public ActividadResponse editar(Integer id, ActividadRequest request) {
    Actividad actividad = buscar(id);
    String nombre = normalizar(request.nombre());
    if (actividades.existeConNombre(nombre, id)) {
      throw new ConflictoException("Ya existe una actividad con ese nombre");
    }
    actividad.setNombre(nombre);
    actividad.setDescripcion(request.descripcion());
    return aResponse(actividad);
  }

  @Transactional
  public void eliminar(Integer id) {
    Actividad actividad = buscar(id);
    if (asignaciones.existsByActividadId(id)) {
      throw new ConflictoException(
          "La actividad tiene socios asignados: inhabilítela en lugar de eliminarla");
    }
    actividades.delete(actividad);
  }

  @Transactional
  public ActividadResponse inhabilitar(Integer id) {
    Actividad actividad = buscar(id);
    actividad.setEstado(EstadoActividad.INHABILITADA);
    return aResponse(actividad);
  }

  @Transactional
  public ActividadResponse habilitar(Integer id) {
    Actividad actividad = buscar(id);
    actividad.setEstado(EstadoActividad.ACTIVA);
    return aResponse(actividad);
  }

  @Transactional(readOnly = true)
  public List<ActividadResponse> listar() {
    return actividades.findAll().stream().map(this::aResponse).toList();
  }

  private Actividad buscar(Integer id) {
    return actividades.findById(id)
        .orElseThrow(() -> new RecursoNoEncontradoException("Actividad no encontrada"));
  }

  private String normalizar(String nombre) {
    if (nombre == null || nombre.trim().isEmpty()) {
      throw new SolicitudInvalidaException("El nombre es obligatorio");
    }
    return nombre.trim();
  }

  private ActividadResponse aResponse(Actividad a) {
    return new ActividadResponse(a.getId(), a.getNombre(), a.getDescripcion(), a.getEstado().name());
  }
}
