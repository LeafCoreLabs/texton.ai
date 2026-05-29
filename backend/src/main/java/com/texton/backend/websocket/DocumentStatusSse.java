package com.texton.backend.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DocumentStatusSse {

    // documentId -> emitter
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /** Client subscribes to a document stream */
    public SseEmitter subscribe(Long documentId) {
        // 0L = no timeout (client controls lifetime)
        SseEmitter emitter = new SseEmitter(0L);
        emitters.put(documentId, emitter);

        emitter.onTimeout(() -> emitters.remove(documentId));
        emitter.onCompletion(() -> emitters.remove(documentId));
        emitter.onError((ex) -> emitters.remove(documentId));

        // optional: send a hello ping so client knows it’s connected
        try {
            emitter.send(SseEmitter.event().name("ping").data("connected"));
        } catch (IOException ignored) {}

        return emitter;
    }

    /** Close and remove any active stream for this document */
    public void disconnect(Long documentId) {
        SseEmitter emitter = emitters.remove(documentId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception ignored) {}
        }
    }

    /** Indexing progress 0–100 while status remains PROCESSING. */
    public void sendProgress(Long documentId, int percent) {
        SseEmitter emitter = emitters.get(documentId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event().name("progress").data(Math.min(100, Math.max(0, percent))));
        } catch (IOException e) {
            emitters.remove(documentId);
        }
    }

    /** Push a status update to the subscriber (if connected) */
    public void sendStatus(Long documentId, String status) {
        SseEmitter emitter = emitters.get(documentId);
        if (emitter == null) return;

        try {
            emitter.send(SseEmitter.event().name("status").data(status));
            if ("PROCESSED".equals(status) || "FAILED".equals(status)) {
                // finish the stream after terminal states
                emitter.complete();
                emitters.remove(documentId);
            }
        } catch (IOException e) {
            try { emitter.completeWithError(e); } catch (Exception ignored) {}
            emitters.remove(documentId);
        }
    }
}
