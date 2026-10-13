package com.gimnasio.repositorio;

import com.gimnasio.entidad.Comprobante;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ComprobanteRepositorio extends JpaRepository<Comprobante, Integer> {
  Optional<Comprobante> findByPagoId(Integer pagoId);

  @Query(value = "select nextval('comprobante_seq')", nativeQuery = true)
  Long siguienteNumero();
}
