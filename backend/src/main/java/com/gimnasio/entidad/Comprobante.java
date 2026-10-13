package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "comprobante")
public class Comprobante {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true)
  private Long nro;

  @Column(name = "pago_id", nullable = false, unique = true)
  private Integer pagoId;

  @Column(length = 50)
  private String etiqueta;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  public Comprobante() {
  }

  public Integer getId() {
    return id;
  }

  public Long getNro() {
    return nro;
  }

  public void setNro(Long nro) {
    this.nro = nro;
  }

  public Integer getPagoId() {
    return pagoId;
  }

  public void setPagoId(Integer pagoId) {
    this.pagoId = pagoId;
  }

  public String getEtiqueta() {
    return etiqueta;
  }

  public void setEtiqueta(String etiqueta) {
    this.etiqueta = etiqueta;
  }

  public OffsetDateTime getCreadoEn() {
    return creadoEn;
  }

  public void setCreadoEn(OffsetDateTime creadoEn) {
    this.creadoEn = creadoEn;
  }
}
