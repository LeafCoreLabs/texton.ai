package com.texton.backend.service;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.texton.backend.config.DocumentIndexingProperties;
import com.texton.backend.util.IndexedChunk;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class ParsingService {

    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${gemini.api-key:}")
    private String GEMINI_API_KEY;

    @Autowired
    private ChromaDB chromaDB;

    @Autowired
    private GroqService groqService;

    @Autowired
    private DocumentIndexingProperties indexingProps;

    private static final String GEMINI_CHAT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final String GEMINI_EMBED_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=";

    // ✅ Extract text using Apache Tika
    public String extractTextFromS3(byte[] fileBytes, String fileName) throws Exception {
        return tika.parseToString(new ByteArrayInputStream(fileBytes));
    }

    private boolean geminiEnabled() {
        return GEMINI_API_KEY != null && !GEMINI_API_KEY.isBlank();
    }

    // ✅ Call Gemini embedding API (or deterministic mock when no API key)
    public List<Double> generateEmbedding(String text) {
        if (!geminiEnabled()) {
            return mockEmbedding(text);
        }
        try {
            String url = GEMINI_EMBED_URL + GEMINI_API_KEY;

            Map<String, Object> body = Map.of(
                    "content", Map.of("parts", List.of(Map.of("text", text)))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            JsonNode jsonNode = mapper.readTree(response.getBody());
            JsonNode embeddingArray = jsonNode.get("embedding").get("values");

            List<Double> vector = new ArrayList<>();
            embeddingArray.forEach(val -> vector.add(val.asDouble()));

            return vector;

        } catch (Exception e) {
            throw new RuntimeException("❌ Gemini Embedding API failed: " + e.getMessage());
        }
    }

    public void saveToChroma(Long documentId, List<IndexedChunk> chunks, List<List<Double>> vectors) {
        chromaDB.save(documentId, chunks, vectors);
    }

    // ✅ Retrieve matching chunks
    public List<String> queryChromaDB(Long documentId, List<Double> queryVector) {
        return chromaDB.query(documentId, queryVector);
    }

    public List<String> queryChromaDBTopK(Long documentId, List<Double> queryVector, int topK) {
        return chromaDB.queryTopK(documentId, queryVector, topK);
    }

    /** High-recall retrieval for large books: wide pool + hybrid rerank. */
    public List<String> queryDocumentReranked(Long documentId, String queryText, List<Double> queryVector) {
        return chromaDB.queryReranked(
                documentId,
                queryVector,
                queryText,
                indexingProps.getQueryRetrieveK(),
                indexingProps.getQueryFinalK());
    }

    public List<String> queryChromaDocuments(List<Long> documentIds, List<Double> queryVector, int topK) {
        return chromaDB.queryDocuments(documentIds, queryVector, topK);
    }

    public List<String> queryStudyPackReranked(List<Long> documentIds, String queryText, List<Double> queryVector) {
        return chromaDB.queryDocumentsReranked(
                documentIds,
                queryVector,
                queryText,
                indexingProps.getStudyRetrieveK(),
                indexingProps.getStudyFinalK());
    }

    public void deleteFromChroma(Long documentId) {
        chromaDB.delete(documentId);
    }

    public List<String> excerptsForPage(Long documentId, int page) {
        return chromaDB.excerptsForPage(documentId, page);
    }

    private List<Double> mockEmbedding(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.getBytes(StandardCharsets.UTF_8));
            int dim = 384;
            List<Double> v = new ArrayList<>(dim);
            for (int i = 0; i < dim; i++) {
                v.add(((int) hash[i % hash.length]) / 128.0);
            }
            return v;
        } catch (Exception e) {
            return List.of(1.0, 0.0, 0.0);
        }
    }

    /** Grounded document Q&A with low temperature and mandatory citation format. */
    public String askGrounded(String query, List<String> matchedChunks, String profileContext) {
        String finalPrompt = buildGroundedUserPrompt(query, matchedChunks);
        String systemPrompt = withProfile(GROUNDED_DOCUMENT_SYSTEM, profileContext);

        if (groqService.isEnabled()) {
            try {
                return groqService.chatGrounded(systemPrompt, finalPrompt);
            } catch (Exception e) {
                return "Groq AI failed: " + e.getMessage();
            }
        }

        return askGemini(query, matchedChunks, profileContext);
    }

    private static String buildGroundedUserPrompt(String query, List<String> matchedChunks) {
        return """
                You are given EXCERPTS ONLY from an indexed book. Each excerpt has a page label.
                Rules:
                1) Use ONLY facts present in the excerpts.
                2) Every claim must cite a page label from the excerpts (e.g. [pp. 120–122]).
                3) If excerpts do not answer the question, reply EXACTLY with:
                   ## Answer
                   Not found in the indexed pages provided.
                   ## Sources
                   (none — insufficient excerpts)
                4) Do NOT invent page numbers, quotes, authors, or topics.

                EXCERPTS:
                ---
                """
                + String.join("\n\n---\n\n", matchedChunks)
                + """

                ---

                QUESTION: """
                + query
                + """

                Respond in Markdown:
                ## Answer
                (detailed, cite pages inline like [p. 42])
                ## Sources
                - [page tag]: brief note on what you used from that excerpt
                """;
    }

    /** RAG answer: Groq (preferred) → Gemini → demo mode */
    public String askGemini(String query, List<String> matchedChunks) {
        return askGemini(query, matchedChunks, null);
    }

    public String askGemini(String query, List<String> matchedChunks, String profileContext) {
        String finalPrompt = buildGroundedUserPrompt(query, matchedChunks);
        String systemPrompt = withProfile(GROUNDED_DOCUMENT_SYSTEM, profileContext);

        if (groqService.isEnabled()) {
            try {
                return groqService.chatGrounded(systemPrompt, finalPrompt);
            } catch (Exception e) {
                return "Groq AI failed: " + e.getMessage();
            }
        }

        if (!geminiEnabled()) {
            String context = String.join("\n", matchedChunks);
            String snippet = context.length() > 800 ? context.substring(0, 800) + "..." : context;
            return "Answer (demo mode — set GROQ_API_KEY in .env for real AI):\n\n"
                    + "Question: " + query + "\n\n"
                    + "From your document:\n" + snippet;
        }
        try {
            String url = GEMINI_CHAT_URL + GEMINI_API_KEY;

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", finalPrompt)
                            ))
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            JsonNode jsonNode = mapper.readTree(response.getBody());
            return jsonNode.get("candidates").get(0).get("content").get("parts").get(0).get("text").asText();

        } catch (Exception e) {
            return "Gemini Chat API failed: " + e.getMessage();
        }
    }

    /** General assistant chat (no document / RAG). */
    public String generalChat(String query, List<Map<String, String>> history) {
        return generalChat(query, history, null);
    }

    public String generalChat(String query, List<Map<String, String>> history, String profileContext) {
        String systemPrompt = withProfile(STUDENT_GENERAL_SYSTEM, profileContext);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (history != null) {
            int start = Math.max(0, history.size() - 20);
            for (int i = start; i < history.size(); i++) {
                Map<String, String> turn = history.get(i);
                String role = turn.get("role");
                String content = turn.get("content");
                if (content == null || content.isBlank()) continue;
                if ("user".equals(role) || "assistant".equals(role)) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }
        messages.add(Map.of("role", "user", "content", query));

        if (groqService.isEnabled()) {
            try {
                return groqService.chatMessages(messages);
            } catch (Exception e) {
                return "Groq AI failed: " + e.getMessage();
            }
        }

        return "Answer (demo mode — set GROQ_API_KEY for real AI):\n\n"
                + "You asked: \"" + query + "\"\n\n"
                + "I'm Texton.ai. In demo mode I can't call the live model, but once Groq is configured "
                + "I'll answer general questions here. Upload a PDF/DOCX/TXT for document Q&A anytime.";
    }

    private static final String GROUNDED_DOCUMENT_SYSTEM =
            "You are Texton.ai document Q&A in strict grounded mode. "
                    + "You may ONLY state facts that appear verbatim or paraphrased from the provided excerpts. "
                    + "Never use outside knowledge. Never guess page numbers. "
                    + "If excerpts are insufficient, refuse to answer except with the prescribed 'Not found' template.";

    private static final String STUDENT_DOCUMENT_SYSTEM = GROUNDED_DOCUMENT_SYSTEM;

    private static final String STUDENT_GENERAL_SYSTEM =
            "You are Texton.ai, a friendly AI study buddy for students by LeafCore Labs. "
                    + "Help with exam preparation, revision plans, memorization techniques, "
                    + "explaining concepts, practice questions, and study strategies. "
                    + "Be encouraging and clear. "
                    + "If they need answers from their own syllabus or textbook, suggest uploading materials. "
                    + "Remind them to cite sources and use AI for learning, not academic dishonesty.";

    private static String withProfile(String base, String profileContext) {
        if (profileContext == null || profileContext.isBlank()) return base;
        return base + " " + profileContext.trim();
    }

    /** Run a study tool with RAG context. */
    public String runStudyTool(String toolId, String context, String extraInstruction) {
        String system = STUDENT_DOCUMENT_SYSTEM;
        String userPrompt = buildStudyUserPrompt(toolId, context, extraInstruction);
        if (groqService.isEnabled()) {
            try {
                return groqService.chatGrounded(system, userPrompt);
            } catch (Exception e) {
                return "Groq AI failed: " + e.getMessage();
            }
        }
        String snippet = context.length() > 1200 ? context.substring(0, 1200) + "..." : context;
        return "Study tool (demo — set GROQ_API_KEY):\n\n" + userPrompt + "\n\nContext preview:\n" + snippet;
    }

    private String buildStudyUserPrompt(String toolId, String context, String extra) {
        String base = "Study material from uploaded documents:\n\n" + context + "\n\n";
        String instruction = switch (toolId) {
            case "notes" -> "Create comprehensive exam-ready study notes in Markdown: "
                    + "title, section headings, key definitions, formulas, examples, and a short summary. "
                    + "Only use the material above.";
            case "exam-summary" -> "List likely exam topics as a revision checklist with one-line explanations. "
                    + "Group by importance. Only use the material above.";
            case "flashcards" -> "Generate exactly 15 flashcards as a JSON array: "
                    + "[{\"question\":\"...\",\"answer\":\"...\"}]. Only content from the material. "
                    + "Return ONLY valid JSON, no markdown fences.";
            case "mcq-quiz" -> "Generate exactly 10 multiple-choice questions as JSON array: "
                    + "[{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0,\"explanation\":\"...\"}]. "
                    + "Only from the material. Return ONLY valid JSON.";
            case "eli15" -> "Explain the hardest concepts from this material in simple language "
                    + "suitable for a high school student. Use analogies.";
            case "topics" -> "Extract study topics as JSON array of strings (8-20 topics). "
                    + "Return ONLY valid JSON like [\"Topic 1\",\"Topic 2\"].";
            case "revision-plan" -> "Create a day-by-day revision plan in Markdown with headings per day, "
                    + "specific topics to cover, active recall tasks, and short breaks. "
                    + "Base the plan only on the study material provided.";
            default -> "Summarize the study material for exam revision.";
        };
        if (extra != null && !extra.isBlank()) {
            instruction += "\nAdditional instruction: " + extra;
        }
        return base + instruction;
    }
}
