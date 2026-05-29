package com.texton.backend.util;

/**
 * A searchable slice of a document with page provenance for citation-style RAG.
 */
public record IndexedChunk(int index, int pageStart, int pageEnd, String text) {

    public String citationLabel() {
        if (pageStart <= 0 && pageEnd <= 0) return "[Source]";
        if (pageStart == pageEnd) return "[p. " + pageStart + "]";
        return "[pp. " + pageStart + "–" + pageEnd + "]";
    }

    public String forRetrieval() {
        return citationLabel() + "\n" + text;
    }

    public boolean coversPage(int page) {
        if (page <= 0 || pageStart <= 0) return false;
        return page >= pageStart && page <= pageEnd;
    }
}
