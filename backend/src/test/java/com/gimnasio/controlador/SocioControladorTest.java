package com.gimnasio.controlador;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gimnasio.config.ZonaHorariaConfig;
import com.gimnasio.dto.DashboardResponse;
import com.gimnasio.dto.FichaSocioResponse;
import com.gimnasio.dto.SocioResponse;
import com.gimnasio.seguridad.JwtFilter;
import com.gimnasio.seguridad.JwtUtil;
import com.gimnasio.seguridad.SecurityConfig;
import com.gimnasio.seguridad.UsuarioDetailsService;
import com.gimnasio.servicio.SocioEstadoServicio;
import com.gimnasio.servicio.SocioServicio;
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

@WebMvcTest(SocioControlador.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtUtil.class, ZonaHorariaConfig.class})
class SocioControladorTest {

  @Autowired
  private MockMvc mvc;

  @MockBean
  private SocioServicio servicio;

  @MockBean
  private SocioEstadoServicio estados;

  @MockBean
  private UsuarioDetailsService usuarios;

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void alta_recepcionista_devuelve201() throws Exception {
    when(servicio.alta(any())).thenReturn(new SocioResponse(1, "34567890", "Juan", "Pérez"));

    mvc.perform(post("/api/socios")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"dni\":\"34.567.890\",\"nombre\":\"Juan\",\"apellido\":\"Pérez\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.dni").value("34567890"));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void alta_admin_devuelve201() throws Exception {
    when(servicio.alta(any())).thenReturn(new SocioResponse(1, "123", "Ana", "López"));

    mvc.perform(post("/api/socios")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"dni\":\"123\",\"nombre\":\"Ana\",\"apellido\":\"López\"}"))
        .andExpect(status().isCreated());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void alta_duplicado_devuelve409() throws Exception {
    when(servicio.alta(any()))
        .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya está registrado"));

    mvc.perform(post("/api/socios")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"dni\":\"123\",\"nombre\":\"Juan\",\"apellido\":\"Pérez\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void alta_incompleta_devuelve400() throws Exception {
    mvc.perform(post("/api/socios")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"dni\":\"123\",\"nombre\":\"\",\"apellido\":\"Pérez\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void asignar_devuelveFicha200() throws Exception {
    when(servicio.asignarActividades(eq(1), any()))
        .thenReturn(new FichaSocioResponse(1, "123", "Juan", "Pérez", List.of()));

    mvc.perform(put("/api/socios/1/actividades")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"actividadIds\":[1,2]}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.nombre").value("Juan"));
  }

  @Test
  void sinToken_devuelve401() throws Exception {
    mvc.perform(get("/api/socios/1")).andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void estado_devuelve200() throws Exception {
    when(estados.dashboard()).thenReturn(new DashboardResponse(List.of(), List.of()));

    mvc.perform(get("/api/socios/estado")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void buscar_devuelve200() throws Exception {
    when(estados.buscar(eq("Juan"))).thenReturn(List.of());

    mvc.perform(get("/api/socios/buscar").param("q", "Juan")).andExpect(status().isOk());
  }
}
