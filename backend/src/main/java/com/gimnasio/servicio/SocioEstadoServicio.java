package com.gimnasio.servicio;

import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.dto.DashboardResponse;
import com.gimnasio.dto.EstadoSocio;
import com.gimnasio.dto.SocioEstadoResponse;
import com.gimnasio.entidad.Actividad;
import com.gimnasio.entidad.Feriado;
import com.gimnasio.entidad.Pago;
import com.gimnasio.entidad.Socio;
import com.gimnasio.entidad.SocioActividad;
import com.gimnasio.repositorio.ActividadRepositorio;
import com.gimnasio.repositorio.FeriadoRepositorio;
import com.gimnasio.repositorio.PagoRepositorio;
import com.gimnasio.repositorio.SocioActividadRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import com.gimnasio.util.FechaService;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocioEstadoServicio {

  static final int LIMITE = 20;

  private final SocioRepositorio socios;
  private final PagoRepositorio pagos;
  private final SocioActividadRepositorio asignaciones;
  private final ActividadRepositorio actividades;
  private final FeriadoRepositorio feriados;
  private final FechaService fechas;
  private final ZoneId zona;

  public SocioEstadoServicio(SocioRepositorio socios, PagoRepositorio pagos,
      SocioActividadRepositorio asignaciones, ActividadRepositorio actividades,
      FeriadoRepositorio feriados, FechaService fechas, ZoneId zonaMendoza) {
    this.socios = socios;
    this.pagos = pagos;
    this.asignaciones = asignaciones;
    this.actividades = actividades;
    this.feriados = feriados;
    this.fechas = fechas;
    this.zona = zonaMendoza;
  }

  @Transactional(readOnly = true)
  public DashboardResponse dashboard() {
    Contexto ctx = cargar();
    List<SocioEstadoResponse> alDia = new ArrayList<>();
    List<SocioEstadoResponse> conDeuda = new ArrayList<>();
    for (Socio socio : ctx.socios()) {
      SocioEstadoResponse r = estadoDe(socio, ctx);
      if (r.estado() == EstadoSocio.AL_DIA) {
        alDia.add(r);
      } else {
        conDeuda.add(r);
      }
    }
    conDeuda.sort(Comparator.comparingLong(SocioEstadoResponse::diasAtraso).reversed());
    return new DashboardResponse(limitar(alDia), limitar(conDeuda));
  }

  @Transactional(readOnly = true)
  public List<SocioEstadoResponse> buscar(String q) {
    if (q == null || q.trim().isEmpty()) {
      return List.of();
    }
    String normalizado = q.replace(".", "").replace(" ", "");
    Optional<Socio> porDni = normalizado.matches("[0-9]+")
        ? socios.findByDni(normalizado)
        : Optional.empty();
    List<Socio> base = porDni.map(List::of).orElseGet(() -> socios.buscarPorTexto(q.trim()));
    if (base.isEmpty()) {
      return List.of();
    }
    Contexto ctx = cargar();
    Map<Integer, Socio> porId = ctx.socios().stream()
        .collect(Collectors.toMap(Socio::getId, s -> s, (a, b) -> a));
    List<SocioEstadoResponse> resultado = new ArrayList<>();
    for (Socio encontrado : base) {
      Socio socio = porId.getOrDefault(encontrado.getId(), encontrado);
      resultado.add(estadoDe(socio, ctx));
    }
    return limitar(resultado);
  }

  private Contexto cargar() {
    List<Socio> listaSocios = socios.findAll();
    Map<Integer, List<String>> periodosPorSocio = new HashMap<>();
    for (Pago p : pagos.findAll()) {
      periodosPorSocio.computeIfAbsent(p.getSocioId(), k -> new ArrayList<>()).add(p.getPeriodo());
    }
    Map<Integer, List<Integer>> actividadesPorSocio = new HashMap<>();
    for (SocioActividad a : asignaciones.findAll()) {
      actividadesPorSocio.computeIfAbsent(a.getSocioId(), k -> new ArrayList<>()).add(a.getActividadId());
    }
    Map<Integer, Actividad> actividadPorId = new HashMap<>();
    for (Actividad a : actividades.findAll()) {
      actividadPorId.put(a.getId(), a);
    }
    Set<LocalDate> diasFeriados = feriados.findAll().stream()
        .map(Feriado::getFecha).collect(Collectors.toSet());
    return new Contexto(listaSocios, periodosPorSocio, actividadesPorSocio, actividadPorId, diasFeriados,
        fechas.hoy());
  }

  private SocioEstadoResponse estadoDe(Socio socio, Contexto ctx) {
    List<String> periodos = ctx.periodosPorSocio().getOrDefault(socio.getId(), List.of());
    String ultimoPagado = periodos.stream().max(String::compareTo).orElse(null);
    String base = ultimoPagado != null
        ? ultimoPagado
        : socio.getCreadoEn().atZoneSameInstant(zona).format(DateTimeFormatter.ofPattern("yyyy-MM"));
    String esperado = YearMonth.parse(base).plusMonths(1).toString();
    LocalDate limite = fechas.fechaLimiteDelPeriodo(esperado, ctx.feriados());
    long dias = fechas.diasAtraso(ctx.hoy(), limite);
    EstadoSocio estado = dias == 0 ? EstadoSocio.AL_DIA : EstadoSocio.CON_DEUDA;

    List<ActividadResponse> items = ctx.actividadesPorSocio()
        .getOrDefault(socio.getId(), List.of()).stream()
        .map(ctx.actividadPorId()::get)
        .filter(a -> a != null)
        .map(a -> new ActividadResponse(a.getId(), a.getNombre(), a.getDescripcion(), a.getEstado().name()))
        .toList();
    return new SocioEstadoResponse(socio.getId(), socio.getDni(), socio.getNombre(), socio.getApellido(),
        items, estado, dias, limite);
  }

  private List<SocioEstadoResponse> limitar(List<SocioEstadoResponse> lista) {
    return lista.stream().limit(LIMITE).toList();
  }

  private record Contexto(List<Socio> socios, Map<Integer, List<String>> periodosPorSocio,
      Map<Integer, List<Integer>> actividadesPorSocio, Map<Integer, Actividad> actividadPorId,
      Set<LocalDate> feriados, LocalDate hoy) {
  }
}
