package com.gimnasio.seguridad;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gimnasio.config.ZonaHorariaConfig;
import com.gimnasio.controlador.ActividadControlador;
import com.gimnasio.servicio.ActividadServicio;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ActividadControlador.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtUtil.class, ZonaHorariaConfig.class})
class SeguridadControlAccesoTest {

  @Autowired
  private MockMvc mvc;

  @Autowired
  private JwtUtil jwtUtil;

  @MockBean
  private UsuarioDetailsService usuarios;

  @MockBean
  private ActividadServicio servicio;

  @Test
  void sinToken_recibe401() throws Exception {
    mvc.perform(get("/api/admin/actividades")).andExpect(status().isUnauthorized());
  }

  @Test
  void tokenInvalido_recibe401() throws Exception {
    mvc.perform(get("/api/admin/actividades").header("Authorization", "Bearer token-invalido"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void tokenRecepcionista_recibe403() throws Exception {
    when(usuarios.loadUserByUsername("recep")).thenReturn(new User("recep", "x",
        List.of(new SimpleGrantedAuthority("ROLE_RECEPCIONISTA"))));
    String token = jwtUtil.generarToken("recep", "RECEPCIONISTA");

    mvc.perform(get("/api/admin/actividades").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden());
  }

  @Test
  void tokenAdmin_recibe200() throws Exception {
    when(usuarios.loadUserByUsername("admin")).thenReturn(new User("admin", "x",
        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    when(servicio.listar()).thenReturn(List.of());
    String token = jwtUtil.generarToken("admin", "ADMIN");

    mvc.perform(get("/api/admin/actividades").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }
}
