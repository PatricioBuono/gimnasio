package com.gimnasio.servicio;

import com.gimnasio.dto.ComprobanteResponse;
import com.gimnasio.dto.PagoRequest;
import com.gimnasio.dto.VistaPreviaResponse;
import com.gimnasio.entidad.Comprobante;
import com.gimnasio.entidad.Feriado;
import com.gimnasio.entidad.Pago;
import com.gimnasio.entidad.ParametroPrecio;
import com.gimnasio.entidad.Usuario;
import com.gimnasio.repositorio.ComprobanteRepositorio;
import com.gimnasio.repositorio.FeriadoRepositorio;
import com.gimnasio.repositorio.PagoRepositorio;
import com.gimnasio.repositorio.ParametroPrecioRepositorio;
import com.gimnasio.repositorio.SocioRepositorio;
import com.gimnasio.repositorio.UsuarioRepositorio;
import com.gimnasio.util.FechaService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.stream.Collectors;import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PagoServicio {

  public static final String ETIQUETA_EXONERADO = "Recargo Bonificado";
  private static final String PREFIJO_SUCURSAL = "0001";

  private final PagoRepositorio pagos;
  private final ComprobanteRepositorio comprobantes;
  private final SocioRepositorio socios;
  private final UsuarioRepositorio usuarios;
  private final ParametroPrecioRepositorio parametros;
  private final FeriadoRepositorio feriados;
  private final FechaService fechas;
  private final Clock reloj;

  public PagoServicio(PagoRepositorio pagos, ComprobanteRepositorio comprobantes, SocioRepositorio socios,
      UsuarioRepositorio usuarios, ParametroPrecioRepositorio parametros, FeriadoRepositorio feriados,
      FechaService fechas, Clock reloj) {
    this.pagos = pagos;
    this.comprobantes = comprobantes;
    this.socios = socios;
    this.usuarios = usuarios;
    this.parametros = parametros;
    this.feriados = feriados;
    this.fechas = fechas;
    this.reloj = reloj;
  }

  @Transactional
  public ComprobanteResponse registrar(PagoRequest request, String usernameCobrador) {
    if (!socios.existsById(request.socioId())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
    }
    Usuario cobrador = usuarios.findByUsername(usernameCobrador)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no válido"));
    if (pagos.existsBySocioIdAndPeriodo(request.socioId(), request.periodo())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El período ya fue cobrado");
    }
    Calculo calculo = calcular(request.socioId(), request.periodo());

    BigDecimal recargo = calculo.recargo();
    String etiqueta = null;
    Integer exoneradoPor = null;
    OffsetDateTime exoneradoAt = null;
    String motivo = null;
    if (request.exonerado()) {
      if (request.motivo() == null || request.motivo().trim().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La exoneración requiere un motivo");
      }
      recargo = BigDecimal.ZERO;
      etiqueta = ETIQUETA_EXONERADO;
      motivo = request.motivo().trim();
      exoneradoPor = cobrador.getId();
      exoneradoAt = OffsetDateTime.now(reloj);
    }

    try {
      Pago pago = new Pago();
      pago.setSocioId(request.socioId());
      pago.setPeriodo(request.periodo());
      pago.setCuota(calculo.cuota());
      pago.setRecargo(recargo);
      pago.setTotal(calculo.cuota().add(recargo));
      pago.setMetodo(request.metodo());
      pago.setExonerado(request.exonerado());
      pago.setMotivoExoneracion(motivo);
      pago.setExoneradoPor(exoneradoPor);
      pago.setExoneradoAt(exoneradoAt);
      pago.setCobradoPor(cobrador.getId());
      pago.setCreadoEn(OffsetDateTime.now(reloj));
      Pago guardado = pagos.save(pago);

      Comprobante comprobante = new Comprobante();
      comprobante.setNro(comprobantes.siguienteNumero());
      comprobante.setPagoId(guardado.getId());
      comprobante.setEtiqueta(etiqueta);
      comprobante.setCreadoEn(OffsetDateTime.now(reloj));
      Comprobante guardadoComp = comprobantes.save(comprobante);

      return new ComprobanteResponse(formatearNumero(guardadoComp.getNro()), guardado.getSocioId(),
          guardado.getPeriodo(), guardado.getCuota(), calculo.semanas(), guardado.getRecargo(),
          guardado.getTotal(), guardado.getMetodo().name(), guardadoComp.getEtiqueta(), calculo.fechaLimite());
    } catch (DataIntegrityViolationException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El período ya fue cobrado");
    }
  }

  @Transactional(readOnly = true)
  public VistaPreviaResponse vistaPrevia(Integer socioId, String periodo) {
    if (!socios.existsById(socioId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
    }
    if (pagos.existsBySocioIdAndPeriodo(socioId, periodo)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El período ya fue cobrado");
    }
    Calculo calculo = calcular(socioId, periodo);
    return new VistaPreviaResponse(calculo.cuota(), calculo.fechaLimite(), calculo.dias(), calculo.semanas(),
        calculo.recargo(), calculo.cuota().add(calculo.recargo()));
  }

  private Calculo calcular(Integer socioId, String periodo) {
    BigDecimal cuota = parametro(ParametroPrecio.CUOTA);
    BigDecimal valorRecargo = parametro(ParametroPrecio.RECARGO_SEMANAL);
    Set<LocalDate> diasFeriados = feriados.findAll().stream()
        .map(Feriado::getFecha).collect(Collectors.toSet());
    LocalDate limite = fechas.fechaLimiteDelPeriodo(periodo, diasFeriados);
    LocalDate hoy = fechas.hoy();
    long dias = fechas.diasAtraso(hoy, limite);
    long semanas = fechas.semanasAtraso(dias);
    BigDecimal recargo = fechas.calcularRecargo(dias, valorRecargo);
    return new Calculo(cuota, limite, dias, semanas, recargo);
  }

  private BigDecimal parametro(String clave) {
    return parametros.findById(clave)
        .map(ParametroPrecio::getValor)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Parámetro no configurado: " + clave));
  }

  private String formatearNumero(Long nro) {
    return PREFIJO_SUCURSAL + "-" + String.format("%08d", nro);
  }

  private record Calculo(BigDecimal cuota, LocalDate fechaLimite, long dias, long semanas, BigDecimal recargo) {
  }
}
