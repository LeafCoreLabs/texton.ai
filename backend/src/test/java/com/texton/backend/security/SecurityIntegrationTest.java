package com.texton.backend.security;

import com.texton.backend.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @BeforeEach
    void stubChat() {
        when(documentService.generalChat(any(), any(), any())).thenReturn("Hello from Texton");
    }

    @Test
    void publicChatAllowsAnonymousAccess() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Hello\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Hello from Texton"));
    }

    @Test
    void protectedDocumentsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void guestReadableCatalogEndpointsAllowAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/subjects"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/packs"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/exams"))
                .andExpect(status().isOk());
    }

    @Test
    void studyRoutesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/study/artifacts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminRoutesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginResponseDoesNotIncludeAccessToken() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"nobody\",\"password\":\"wrong\",\"user_type\":\"user\"}"))
                .andExpect(status().is4xxClientError());
    }
}
