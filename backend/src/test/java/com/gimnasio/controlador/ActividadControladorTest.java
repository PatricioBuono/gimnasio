package com.gimnasio.controlador;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gimnasio.config.ZonaHorariaConfig;
import com.gimnasio.dto.ActividadResponse;
import com.gimnasio.seguridad.JwtFilter;
import com.gimnasio.seguridad.JwtUtil;
import com.gimnasio.seguridad.SecurityConfig;
import com.gimnasio.seguridad.UsuarioDetailsService;
import com.gimnasio.servicio.ActividadServicio;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(ActividadControlador.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtUtil.class, ZonaHorariaConfig.class})
class ActividadControladorTest {

  @Autowired
  private MockMvc mvc;

  @MockBean
  private ActividadServicio servicio;

  @MockBean
  private UsuarioDetailsService usuarios;

  @Test
  @WithMockUser(roles = "ADMIN")
  void crear_admin_devuelve201() throws Exception {
    when(servicio.crear(any())).thenReturn(new ActividadResponse(1, "Crossfit", "Fuerza", "ACTIVA"));

    mvc.perform(post("/api/admin/actividades")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nombre\":\"Crossfit\",\"descripcion\":\"Fuerza\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.estado").value("ACTIVA"));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void crear_duplicado_devuelve409() throws Exception {
    when(servicio.crear(any()))
        .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe"));

    mvc.perform(post("/api/admin/actividades")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nombre\":\"Crossfit\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void crear_nombreVacio_devuelve400() throws Exception {
    mvc.perform(post("/api/admin/actividades")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nombre\":\"\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void eliminar_conSocios_devuelve409() throws Exception {
    doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Tiene socios"))
        .when(servicio).eliminar(eq(1));

    mvc.perform(delete("/api/admin/actividades/1")).andExpect(status().isConflict());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void listar_devuelve200() throws Exception {
    when(servicio.listar()).thenReturn(List.of());

    mvc.perform(get("/api/admin/actividades")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void inhabilitar_devuelve200() throws Exception {
    when(servicio.inhabilitar(eq(1)))
        .thenReturn(new ActividadResponse(1, "Crossfit", "Fuerza", "INHABILITADA"));

    mvc.perform(patch("/api/admin/actividades/1/inhabilitar"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.estado").value("INHABILITADA"));
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void recepcionista_devuelve403() throws Exception {
    mvc.perform(get("/api/admin/actividades")).andExpect(status().isForbidden());
  }

  @Test
  void sinToken_devuelve401() throws Exception {
    mvc.perform(get("/api/admin/actividades")).andExpect(status().isUnauthorized());
  }
}
