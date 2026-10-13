package com.gimnasio.entidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "feriado")
public class Feriado {

  @Id
  private LocalDate fecha;

  @Column(nullable = false, length = 200)
  private String descripcion;

  protected Feriado() {
  }

  public Feriado(LocalDate fecha, String descripcion) {
    this.fecha = fecha;
    this.descripcion = descripcion;
  }

  public LocalDate getFecha() {
    return fecha;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }
}
