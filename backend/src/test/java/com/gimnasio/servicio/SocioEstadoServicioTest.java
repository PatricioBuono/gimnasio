package com.gimnasio.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gimnasio.dto.DashboardResponse;
import com.gimnasio.dto.EstadoSocio;
import com.gimnasio.dto.SocioEstadoResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.Pago;
import com.gimnasio.entidad.Socio;
import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.FeriadoRepositorio;
import com.gimnasio.repositorio.PagoRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import com.gimnasio.util.FechaService;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SocioEstadoServicioTest {

  private static final ZoneId ZONA = ZoneId.of("America/Argentina/Mendoza");

  @Mock
  private SocioRepositorio socios;
  @Mock
  private PagoRepositorio pagos;
  @Mock
  private SocioActividadRepositorio asignaciones;
  @Mock
  private ActividadRepositorio actividades;
  @Mock
  private FeriadoRepositorio feriados;

  private SocioEstadoServicio servicio;

  @BeforeEach
  void setup() {
    servicio = new SocioEstadoServicio(socios, pagos, asignaciones, actividades, feriados,
        new FechaService(Clock.fixed(Instant.parse("2026-10-05T15:00:00Z"), ZONA)), ZONA);
    lenient().when(feriados.findAll()).thenReturn(List.of());
  }

  @Test
  void dashboard_separaAlDiaYMorosos() {
    Socio alDia = socio(1, "111", "Ana", "Luz", "2026-09-01T12:00:00-03:00");
    Socio moroso = socio(2, "222", "Juan", "Paz", "2026-08-01T12:00:00-03:00");
    when(socios.findAll()).thenReturn(List.of(alDia, moroso));
    when(pagos.findAll()).thenReturn(List.of(pago(1, "2026-09")));
    when(asignaciones.findAll()).thenReturn(List.of());
    when(actividades.findAll()).thenReturn(List.of());

    DashboardResponse r = servicio.dashboard();

    assertEquals(1, r.alDia().size());
    assertEquals("Ana", r.alDia().get(0).nombre());
    assertEquals(EstadoSocio.AL_DIA, r.alDia().get(0).estado());
    assertEquals(0, r.alDia().get(0).diasAtraso());
    assertEquals(1, r.conDeuda().size());
    assertEquals("Juan", r.conDeuda().get(0).nombre());
    assertEquals(EstadoSocio.CON_DEUDA, r.conDeuda().get(0).estado());
    assertEquals(25, r.conDeuda().get(0).diasAtraso());
  }

  @Test
  void dashboard_ordenaMorososPorDiasDesc() {
    Socio b = socio(2, "222", "Beto", "B", "2026-08-01T12:00:00-03:00");
    Socio c = socio(3, "333", "Celia", "C", "2026-05-01T12:00:00-03:00");
    when(socios.findAll()).thenReturn(List.of(b, c));
    when(pagos.findAll()).thenReturn(List.of(pago(3, "2026-06")));
    when(asignaciones.findAll()).thenReturn(List.of());
    when(actividades.findAll()).thenReturn(List.of());

    DashboardResponse r = servicio.dashboard();

    assertEquals(2, r.conDeuda().size());
    assertEquals("Celia", r.conDeuda().get(0).nombre());
    assertEquals(87, r.conDeuda().get(0).diasAtraso());
    assertEquals("Beto", r.conDeuda().get(1).nombre());
  }

  @Test
  void dashboard_limitaA20PorLista() {
    List<Socio> muchos = new ArrayList<>();
    for (int i = 1; i <= 25; i++) {
      muchos.add(socio(i, "900" + i, "N" + i, "A", "2026-01-05T12:00:00-03:00"));
    }
    when(socios.findAll()).thenReturn(muchos);
    when(pagos.findAll()).thenReturn(List.of());
    when(asignaciones.findAll()).thenReturn(List.of());
    when(actividades.findAll()).thenReturn(List.of());

    DashboardResponse r = servicio.dashboard();

    assertEquals(0, r.alDia().size());
    assertEquals(20, r.conDeuda().size());
  }

  @Test
  void dashboard_incluyeActividadesAnidadas() {
    Socio s = socio(1, "111", "Ana", "Luz", "2026-09-01T12:00:00-03:00");
    Actividad a = new Actividad("Crossfit", null, OffsetDateTime.now());
    ReflectionTestUtils.setField(a, "id", 7);
    when(socios.findAll()).thenReturn(List.of(s));
    when(pagos.findAll()).thenReturn(List.of());
    when(asignaciones.findAll()).thenReturn(List.of(new SocioActividad(1, 7)));
    when(actividades.findAll()).thenReturn(List.of(a));

    DashboardResponse r = servicio.dashboard();

    assertEquals(1, r.alDia().get(0).actividades().size());
    assertEquals("Crossfit", r.alDia().get(0).actividades().get(0).nombre());
  }

  @Test
  void buscar_porDniExacto_devuelveConEstado() {
    Socio s = socio(1, "34567890", "Juan", "Pérez", "2026-09-01T12:00:00-03:00");
    when(socios.findByDni("34567890")).thenReturn(Optional.of(s));
    when(socios.findAll()).thenReturn(List.of(s));
    when(pagos.findAll()).thenReturn(List.of());
    when(asignaciones.findAll()).thenReturn(List.of());
    when(actividades.findAll()).thenReturn(List.of());

    List<SocioEstadoResponse> r = servicio.buscar("34.567.890");

    assertEquals(1, r.size());
    assertEquals("Juan", r.get(0).nombre());
    verify(socios, never()).buscarPorTexto(any());
  }

  @Test
  void buscar_porNombre_insensibleAMayusculas() {
    Socio s = socio(1, "111", "Juana", "Luz", "2026-09-01T12:00:00-03:00");
    when(socios.buscarPorTexto("JUAN")).thenReturn(List.of(s));
    when(socios.findAll()).thenReturn(List.of(s));
    when(pagos.findAll()).thenReturn(List.of());
    when(asignaciones.findAll()).thenReturn(List.of());
    when(actividades.findAll()).thenReturn(List.of());

    List<SocioEstadoResponse> r = servicio.buscar("JUAN");

    assertEquals(1, r.size());
    assertEquals(EstadoSocio.AL_DIA, r.get(0).estado());
  }

  @Test
  void buscar_vacio_devuelveVacioSinConsultar() {
    assertTrue(servicio.buscar("   ").isEmpty());
    verify(socios, never()).findByDni(any());
    verify(socios, never()).buscarPorTexto(any());
  }

  private Socio socio(int id, String dni, String nombre, String apellido, String creadoEn) {
    Socio s = new Socio(dni, nombre, apellido, OffsetDateTime.parse(creadoEn));
    ReflectionTestUtils.setField(s, "id", id);
    return s;
  }

  private Pago pago(int socioId, String periodo) {
    Pago p = new Pago();
    p.setSocioId(socioId);
    p.setPeriodo(periodo);
    return p;
  }
}
