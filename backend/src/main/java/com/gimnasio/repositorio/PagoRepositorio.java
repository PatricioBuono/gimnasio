package com.gimnasio.repositorio;

import com.gimnasio.entidad.Pago;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepositorio extends JpaRepository<Pago, Integer> {
  boolean existsBySocioIdAndPeriodo(Integer socioId, String periodo);

  Optional<Pago> findBySocioIdAndPeriodo(Integer socioId, String periodo);
}
