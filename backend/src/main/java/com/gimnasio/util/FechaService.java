package com.gimnasio.util;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class FechaService {

  private final Clock reloj;

  public FechaService(Clock reloj) {
    this.reloj = reloj;
  }

  public LocalDate hoy() {
    return LocalDate.now(reloj);
  }

  public LocalDate fechaLimite(int anio, int mes, Set<LocalDate> feriados) {
    LocalDate limite = LocalDate.of(anio, mes, 10);
    while (esNoHabil(limite, feriados)) {
      limite = limite.plusDays(1);
    }
    return limite;
  }

  public LocalDate fechaLimiteDelPeriodo(String periodo, Set<LocalDate> feriados) {
    String[] partes = periodo.split("-");
    return fechaLimite(Integer.parseInt(partes[0]), Integer.parseInt(partes[1]), feriados);
  }

  public long diasAtraso(LocalDate hoy, LocalDate limite) {
    return Math.max(0, ChronoUnit.DAYS.between(limite, hoy));
  }

  public long semanasAtraso(long dias) {
    if (dias <= 0) {
      return 0;
    }
    return (dias + 6) / 7;
  }

  public BigDecimal calcularRecargo(long dias, BigDecimal valorRecargo) {
    return valorRecargo.multiply(BigDecimal.valueOf(semanasAtraso(dias)));
  }

  private boolean esNoHabil(LocalDate fecha, Set<LocalDate> feriados) {
    DayOfWeek dia = fecha.getDayOfWeek();
    return dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY || feriados.contains(fecha);
  }
}
