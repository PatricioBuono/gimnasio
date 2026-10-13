package com.gimnasio.repositorio;

import com.gimnasio.entidad.Feriado;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeriadoRepositorio extends JpaRepository<Feriado, LocalDate> {
}
