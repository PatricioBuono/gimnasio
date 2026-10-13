package com.gimnasio.controlador;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.gimnasio.config.ZonaHorariaConfig;
import com.gimnasio.dto.ComprobanteResponse;
import com.gimnasio.dto.VistaPreviaResponse;
import com.gimnasio.seguridad.JwtFilter;
import com.gimnasio.seguridad.JwtUtil;
import com.gimnasio.seguridad.SecurityConfig;
import com.gimnasio.seguridad.UsuarioDetailsService;
import com.gimnasio.servicio.PagoServicio;
import java.math.BigDecimal;
import java.time.LocalDate;
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

@WebMvcTest(PagoControlador.class)
@Import({SecurityConfig.class, JwtFilter.class, JwtUtil.class, ZonaHorariaConfig.class})
class PagoControladorTest {

  @Autowired
  private MockMvc mvc;

  @MockBean
  private PagoServicio servicio;

  @MockBean
  private UsuarioDetailsService usuarios;

  @Test
  @WithMockUser(username = "recep", roles = "RECEPCIONISTA")
  void registrar_recepcionista_devuelve201ConDesglose() throws Exception {
    when(servicio.registrar(any(), eq("recep"))).thenReturn(new ComprobanteResponse("0001-00000001", 1,
        "2026-10", new BigDecimal("10000"), 2, new BigDecimal("1000"), new BigDecimal("11000"), "EFECTIVO",
        null, LocalDate.of(2026, 10, 12)));

    mvc.perform(post("/api/pagos")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"socioId\":1,\"periodo\":\"2026-10\",\"metodo\":\"EFECTIVO\",\"exonerado\":false}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.numero").value("0001-00000001"))
        .andExpect(jsonPath("$.total").value(11000));
  }

  @Test
  @WithMockUser(username = "recep", roles = "RECEPCIONISTA")
  void registrar_duplicado_devuelve409() throws Exception {
    when(servicio.registrar(any(), anyString()))
        .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "El período ya fue cobrado"));

    mvc.perform(post("/api/pagos")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"socioId\":1,\"periodo\":\"2026-10\",\"metodo\":\"EFECTIVO\",\"exonerado\":false}"))
        .andExpect(status().isConflict());
  }

  @Test
  @WithMockUser(username = "recep", roles = "RECEPCIONISTA")
  void registrar_periodoInvalido_devuelve400() throws Exception {
    mvc.perform(post("/api/pagos")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"socioId\":1,\"periodo\":\"2026-13\",\"metodo\":\"EFECTIVO\",\"exonerado\":false}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser(username = "recep", roles = "RECEPCIONISTA")
  void vistaPrevia_devuelve200() throws Exception {
    when(servicio.vistaPrevia(eq(1), eq("2026-10"))).thenReturn(new VistaPreviaResponse(
        new BigDecimal("10000"), LocalDate.of(2026, 10, 12), 8, 2, new BigDecimal("1000"),
        new BigDecimal("11000")));

    mvc.perform(get("/api/pagos/vista-previa").param("socioId", "1").param("periodo", "2026-10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.semanas").value(2));
  }

  @Test
  void sinToken_devuelve401() throws Exception {
    mvc.perform(get("/api/pagos/vista-previa").param("socioId", "1").param("periodo", "2026-10"))
        .andExpect(status().isUnauthorized());
  }
}
