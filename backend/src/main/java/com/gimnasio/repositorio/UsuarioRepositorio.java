package com.gimnasio.repositorio;

import com.gimnasio.entidad.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Integer> {
  Optional<Usuario> findByUsername(String username);
}
