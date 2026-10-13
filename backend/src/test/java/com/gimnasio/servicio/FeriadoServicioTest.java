package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.FeriadoRequest;
import com.gimnasio.dto.FeriadoResponse;
import com.gimnasio.entidad.Feriado;
import com.gimnasio.repositorio.FeriadoRepositorio;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class FeriadoServicioTest {

  @Mock
  private FeriadoRepositorio feriados;

  @InjectMocks
  private FeriadoServicio servicio;

  private final LocalDate fecha = LocalDate.of(2026, 12, 25);

  @Test
  void crear_nuevo_guarda() {
    when(feriados.existsById(fecha)).thenReturn(false);
    when(feriados.save(any())).thenAnswer(i -> i.getArgument(0));

    FeriadoResponse r = servicio.crear(new FeriadoRequest(fecha, "Navidad"));

    assertEquals(fecha, r.fecha());
    assertEquals("Navidad", r.descripcion());
  }

  @Test
  void crear_duplicado_bloquea409() {
    when(feriados.existsById(fecha)).thenReturn(true);

    ResponseStatusException e = assertThrows(ResponseStatusException.class,
        () -> servicio.crear(new FeriadoRequest(fecha, "x")));
    assertEquals(409, e.getStatusCode().value());
    verify(feriados, never()).save(any());
  }

  @Test
  void editar_existente_actualizaDescripcion() {
    Feriado f = new Feriado(fecha, "vieja");
    when(feriados.findById(fecha)).thenReturn(Optional.of(f));

    FeriadoResponse r = servicio.editar(new FeriadoRequest(fecha, "nueva"));

    assertEquals("nueva", r.descripcion());
  }

  @Test
  void editar_inexistente_bloquea404() {
    when(feriados.findById(fecha)).thenReturn(Optional.empty());
    assertEquals(404, assertThrows(ResponseStatusException.class,
        () -> servicio.editar(new FeriadoRequest(fecha, "x"))).getStatusCode().value());
  }

  @Test
  void eliminar_inexistente_bloquea404() {
    when(feriados.existsById(fecha)).thenReturn(false);
    assertEquals(404, assertThrows(ResponseStatusException.class,
        () -> servicio.eliminar(fecha)).getStatusCode().value());
    verify(feriados, never()).deleteById(any());
  }
}
