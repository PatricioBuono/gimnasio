package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "actividad")
public class Actividad {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, length = 100)
  private String nombre;

  @Column
  private String descripcion;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private EstadoActividad estado = EstadoActividad.ACTIVA;

  @Column(name = "creado_en", nullable = false)
  private OffsetDateTime creadoEn;

  protected Actividad() {
  }

  public Actividad(String nombre, String descripcion, OffsetDateTime creadoEn) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.creadoEn = creadoEn;
  }

  public Integer getId() {
    return id;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }

  public EstadoActividad getEstado() {
    return estado;
  }

  public void setEstado(EstadoActividad estado) {
    this.estado = estado;
  }
}
