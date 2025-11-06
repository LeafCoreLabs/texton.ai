package com.texton.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Produces the final answer from retrieved chunks + user query.
 * - MOCK: simple extractive/summary-ish response
 * - REAL: call Gemini with prompt constructed from chunks
 */
@Service
public class AiService {

    @Value("${ai.mode:MOCK}")
    private String mode;

    @Value("${ai.gemini.apiKey:}")
    private String geminiKey;

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public String answer(String query, List<String> topChunks) {
        if ("REAL".equalsIgnoreCase(mode) && geminiUsable()) {
            // TODO: implement Gemini HTTP call with your key (Google AI Studio client or raw REST).
            // return callGemini(query, topChunks);
        }
        return mockAnswer(query, topChunks);
    }

    private boolean geminiUsable() {
        return geminiKey != null && !geminiKey.isBlank();
    }

    private String mockAnswer(String query, List<String> chunks) {
        String joined = String.join("\n---\n", chunks);
        String snippet = joined.length() > 1000 ? joined.substring(0, 1000) + "..." : joined;
        return "Answer (MOCK): Based on the most relevant parts of your document for the query:\n"
                + "\"" + query + "\"\n\n"
                + "Key context:\n" + snippet + "\n\n"
                + "This is a heuristic answer generated without calling an external LLM.";
    }
}
