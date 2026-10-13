package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pago")
public class Pago {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(name = "socio_id", nullable = false)
  private Integer socioId;

  @Column(nullable = false, length = 7)
  private String periodo;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal cuota;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal recargo = BigDecimal.ZERO;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal total;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private MetodoPago metodo;

  @Column(nullable = false)
  private boolean exonerado = false;

  @Column(name = "motivo_exoneracion")
  private String motivoExoneracion;

  @Column(name = "exonerado_por")
  private Integer exoneradoPor;

  @Column(name = "exonerado_at")
  private OffsetDateTime exoneradoAt;

  @Column(name = "cobrado_por")
  private Integer cobradoPor;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  public Pago() {
  }

  public Integer getId() {
    return id;
  }

  public Integer getSocioId() {
    return socioId;
  }

  public void setSocioId(Integer socioId) {
    this.socioId = socioId;
  }

  public String getPeriodo() {
    return periodo;
  }

  public void setPeriodo(String periodo) {
    this.periodo = periodo;
  }

  public BigDecimal getCuota() {
    return cuota;
  }

  public void setCuota(BigDecimal cuota) {
    this.cuota = cuota;
  }

  public BigDecimal getRecargo() {
    return recargo;
  }

  public void setRecargo(BigDecimal recargo) {
    this.recargo = recargo;
  }

  public BigDecimal getTotal() {
    return total;
  }

  public void setTotal(BigDecimal total) {
    this.total = total;
  }

  public MetodoPago getMetodo() {
    return metodo;
  }

  public void setMetodo(MetodoPago metodo) {
    this.metodo = metodo;
  }

  public boolean isExonerado() {
    return exonerado;
  }

  public void setExonerado(boolean exonerado) {
    this.exonerado = exonerado;
  }

  public String getMotivoExoneracion() {
    return motivoExoneracion;
  }

  public void setMotivoExoneracion(String motivoExoneracion) {
    this.motivoExoneracion = motivoExoneracion;
  }

  public Integer getExoneradoPor() {
    return exoneradoPor;
  }

  public void setExoneradoPor(Integer exoneradoPor) {
    this.exoneradoPor = exoneradoPor;
  }

  public OffsetDateTime getExoneradoAt() {
    return exoneradoAt;
  }

  public void setExoneradoAt(OffsetDateTime exoneradoAt) {
    this.exoneradoAt = exoneradoAt;
  }

  public Integer getCobradoPor() {
    return cobradoPor;
  }

  public void setCobradoPor(Integer cobradoPor) {
    this.cobradoPor = cobradoPor;
  }

  public OffsetDateTime getCreadoEn() {
    return creadoEn;
  }

  public void setCreadoEn(OffsetDateTime creadoEn) {
    this.creadoEn = creadoEn;
  }
}
