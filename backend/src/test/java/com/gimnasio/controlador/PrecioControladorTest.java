package com.gimnasio.controlador;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gimnasio.config.ZonaHorariaConfig;
import com.gimnasio.dto.PrecioResponse;
import com.gimnasio.seguridad.JwtFilter;
import com.gimnasio.seguridad.JwtUtil;
import com.gimnasio.seguridad.SecurityConfig;
import com.gimnasio.seguridad.UsuarioDetailsService;
import com.gimnasio.servicio.PrecioServicio;
import java.math.BigDecimal;
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

@WebMvcTest(PrecioControlador.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtUtil.class, ZonaHorariaConfig.class})
class PrecioControladorTest {

  @Autowired
  private MockMvc mvc;

  @MockBean
  private PrecioServicio servicio;

  @MockBean
  private UsuarioDetailsService usuarios;

  @Test
  @WithMockUser(roles = "ADMIN")
  void actualizarCuota_valida_devuelve200() throws Exception {
    when(servicio.actualizarCuota(any()))
        .thenReturn(new PrecioResponse("CUOTA", new BigDecimal("15000.50")));

    mvc.perform(put("/api/admin/precios/cuota")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"valor\":15000.50}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.clave").value("CUOTA"));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void actualizarCuota_invalida_devuelve400() throws Exception {
    when(servicio.actualizarCuota(any()))
        .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe ser mayor a 0"));

    mvc.perform(put("/api/admin/precios/cuota")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"valor\":0}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void actualizarRecargo_valorNulo_devuelve400() throws Exception {
    mvc.perform(put("/api/admin/precios/recargo")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(roles = "RECEPCIONISTA")
  void recepcionista_devuelve403() throws Exception {
    mvc.perform(get("/api/admin/precios")).andExpect(status().isForbidden());
  }
}
