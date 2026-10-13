package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "parametro_precio")
public class ParametroPrecio {

  public static final String CUOTA = "CUOTA";
  public static final String RECARGO_SEMANAL = "RECARGO_SEMANAL";

  @Id
  @Column(length = 50)
  private String clave;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal valor;

  @Column(name = "actualizado_en", nullable = false)
  private OffsetDateTime actualizadoEn;

  protected ParametroPrecio() {
  }

  public ParametroPrecio(String clave, BigDecimal valor, OffsetDateTime actualizadoEn) {
    this.clave = clave;
    this.valor = valor;
    this.actualizadoEn = actualizadoEn;
  }

  public String getClave() {
    return clave;
  }

  public BigDecimal getValor() {
    return valor;
  }

  public void setValor(BigDecimal valor) {
    this.valor = valor;
  }

  public void setActualizadoEn(OffsetDateTime actualizadoEn) {
    this.actualizadoEn = actualizadoEn;
  }
}
