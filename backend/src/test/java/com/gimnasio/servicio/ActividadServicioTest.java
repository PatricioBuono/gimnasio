package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.ActividadRequest;
import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.EstadoActividad;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ActividadServicioTest {

  private static final ZoneId ZONA = ZoneId.of("America/Argentina/Mendoza");

  @Mock
  private ActividadRepositorio actividades;
  @Mock
  private SocioActividadRepositorio asignaciones;

  private ActividadServicio servicio;

  @BeforeEach
  void setup() {
    servicio = new ActividadServicio(actividades, asignaciones,
        Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"), ZONA));
  }

  @Test
  void crear_exitosa_quedaActiva() {
    when(actividades.existeConNombre("Crossfit", null)).thenReturn(false);
    when(actividades.save(any())).thenAnswer(i -> i.getArgument(0));

    ActividadResponse r = servicio.crear(new ActividadRequest("  Crossfit ", "Fuerza"));

    assertEquals("Crossfit", r.nombre());
    assertEquals("ACTIVA", r.estado());
    verify(actividades).save(any());
  }

  @Test
  void crear_duplicadoInsensibleAMayusculas_bloquea409() {
    when(actividades.existeConNombre("CROSSFIT", null)).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.crear(new ActividadRequest("CROSSFIT", "x")));
    assertEquals(409, e.getStatusCode().value());
    verify(actividades, never()).save(any());
  }

  @Test
  void crear_nombreVacio_bloquea400() {
    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.crear(new ActividadRequest("   ", "x")));
    assertEquals(400, e.getStatusCode().value());
  }

  @Test
  void editar_existente_actualiza() {
    Actividad a = new Actividad("Viejo", "d", OffsetDateTime.now());
    when(actividades.findById(1)).thenReturn(Optional.of(a));
    when(actividades.existeConNombre("Nuevo", 1)).thenReturn(false);

    ActividadResponse r = servicio.editar(1, new ActividadRequest("Nuevo", "otra"));

    assertEquals("Nuevo", r.nombre());
    assertEquals("otra", r.descripcion());
  }

  @Test
  void editar_inexistente_bloquea404() {
    when(actividades.findById(9)).thenReturn(Optional.empty());
    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.editar(9, new ActividadRequest("X", "x")));
    assertEquals(404, e.getStatusCode().value());
  }

  @Test
  void editar_aNombreDuplicado_bloquea409() {
    Actividad a = new Actividad("A", "d", OffsetDateTime.now());
    when(actividades.findById(1)).thenReturn(Optional.of(a));
    when(actividades.existeConNombre("B", 1)).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.editar(1, new ActividadRequest("B", "x")));
    assertEquals(409, e.getStatusCode().value());
  }

  @Test
  void eliminar_sinSocios_elimina() {
    Actividad a = new Actividad("A", "d", OffsetDateTime.now());
    when(actividades.findById(1)).thenReturn(Optional.of(a));
    when(asignaciones.existsByActividadId(1)).thenReturn(false);

    servicio.eliminar(1);

    verify(actividades).delete(a);
  }

  @Test
  void eliminar_conSocios_bloquea409() {
    Actividad a = new Actividad("Crossfit", "d", OffsetDateTime.now());
    when(actividades.findById(1)).thenReturn(Optional.of(a));
    when(asignaciones.existsByActividadId(1)).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.eliminar(1));
    assertEquals(409, e.getStatusCode().value());
    verify(actividades, never()).delete(any());
  }

  @Test
  void inhabilitar_y_habilitar_cambianEstado() {
    Actividad a = new Actividad("A", "d", OffsetDateTime.now());
    when(actividades.findById(1)).thenReturn(Optional.of(a));

    assertEquals("INHABILITADA", servicio.inhabilitar(1).estado());
    assertEquals(EstadoActividad.INHABILITADA, a.getEstado());
    assertEquals("ACTIVA", servicio.habilitar(1).estado());
  }
}
