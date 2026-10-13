package com.gimnasio.repositorio;

import com.gimnasio.entidad.Socio;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocioRepositorio extends JpaRepository<Socio, Integer> {
  boolean existsByDni(String dni);

  Optional<Socio> findByDni(String dni);
}
