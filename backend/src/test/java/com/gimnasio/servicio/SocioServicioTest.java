package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.AsignacionRequest;
import com.gimnasio.dto.FichaSocioResponse;
import com.gimnasio.dto.SocioRequest;
import com.gimnasio.dto.SocioResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.EstadoActividad;
import com.gimnasio.entidad.Socio;
import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SocioServicioTest {

  @Mock
  private SocioRepositorio socios;
  @Mock
  private ActividadRepositorio actividades;
  @Mock
  private SocioActividadRepositorio asignaciones;

  private SocioServicio servicio;

  @BeforeEach
  void setup() {
    servicio = new SocioServicio(socios, actividades, asignaciones,
        Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"), ZoneId.of("America/Argentina/Mendoza")));
  }

  @Test
  void alta_exitosa_normalizaDni() {
    when(socios.existsByDni("34567890")).thenReturn(false);
    when(socios.save(any())).thenAnswer(i -> i.getArgument(0));

    SocioResponse r = servicio.alta(new SocioRequest("34.567.890", "Juan", "Pérez"));

    assertEquals("34567890", r.dni());
    verify(socios).save(any());
  }

  @Test
  void alta_duplicado_bloquea409() {
    when(socios.existsByDni("123")).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.alta(new SocioRequest("123", "Juan", "Pérez")));
    assertEquals(409, e.getStatusCode().value());
    verify(socios, never()).save(any());
  }

  @Test
  void alta_datosIncompletos_bloquea400() {
    assertEquals(400, assertThrows(ResponseStatusException.class,
        () -> servicio.alta(new SocioRequest("", "Juan", "Pérez"))).getStatusCode().value());
    assertEquals(400, assertThrows(ResponseStatusException.class,
        () -> servicio.alta(new SocioRequest("123", "  ", "Pérez"))).getStatusCode().value());
    assertEquals(400, assertThrows(ResponseStatusException.class,
        () -> servicio.alta(new SocioRequest("ABC", "Juan", "Pérez"))).getStatusCode().value());
  }

  @Test
  void asignar_activas_vinculaYDevuelveFicha() {
    Socio socio = new Socio("123", "Juan", "Pérez", OffsetDateTime.now());
    Actividad a1 = actividad(1, "Crossfit", EstadoActividad.ACTIVA);
    Actividad a2 = actividad(2, "Yoga", EstadoActividad.ACTIVA);
    when(socios.findById(1)).thenReturn(Optional.of(socio));
    when(actividades.findById(1)).thenReturn(Optional.of(a1));
    when(actividades.findById(2)).thenReturn(Optional.of(a2));

    FichaSocioResponse ficha = servicio.asignarActividades(1, new AsignacionRequest(List.of(1, 2, 1)));

    assertEquals(2, ficha.actividades().size());
    verify(asignaciones).deleteBySocioId(1);
  }

  @Test
  void asignar_socioInexistente_bloquea404() {
    when(socios.findById(9)).thenReturn(Optional.empty());
    assertEquals(404, assertThrows(ResponseStatusException.class,
        () -> servicio.asignarActividades(9, new AsignacionRequest(List.of(1)))).getStatusCode().value());
  }

  @Test
  void asignar_inactiva_bloquea400() {
    Socio socio = new Socio("123", "Juan", "Pérez", OffsetDateTime.now());
    when(socios.findById(1)).thenReturn(Optional.of(socio));
    when(actividades.findById(2)).thenReturn(Optional.of(actividad(2, "Yoga", EstadoActividad.INHABILITADA)));

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.asignarActividades(1, new AsignacionRequest(List.of(2))));
    assertEquals(400, e.getStatusCode().value());
    verify(asignaciones, never()).save(any());
  }

  @Test
  void asignar_actividadInexistente_bloquea404() {
    Socio socio = new Socio("123", "Juan", "Pérez", OffsetDateTime.now());
    when(socios.findById(1)).thenReturn(Optional.of(socio));
    when(actividades.findById(7)).thenReturn(Optional.empty());

    assertEquals(404, assertThrows(ResponseStatusException.class,
        () -> servicio.asignarActividades(1, new AsignacionRequest(List.of(7)))).getStatusCode().value());
  }

  @Test
  void ficha_muestraActividadesVinculadas() {
    Socio socio = new Socio("123", "Juan", "Pérez", OffsetDateTime.now());
    when(socios.findById(1)).thenReturn(Optional.of(socio));
    when(asignaciones.findBySocioId(1)).thenReturn(List.of(new SocioActividad(1, 5)));
    when(actividades.findById(5)).thenReturn(Optional.of(actividad(5, "Boxeo", EstadoActividad.ACTIVA)));

    FichaSocioResponse ficha = servicio.ficha(1);

    assertEquals("Juan", ficha.nombre());
    assertEquals(1, ficha.actividades().size());
    assertEquals("Boxeo", ficha.actividades().get(0).nombre());
  }

  private Actividad actividad(int id, String nombre, EstadoActividad estado) {
    Actividad a = new Actividad(nombre, null, OffsetDateTime.now());
    a.setEstado(estado);
    return a;
  }
}
