package com.texton.backend.util;

import com.texton.backend.config.DocumentIndexingProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    @Autowired
    private DocumentIndexingProperties props;

    /** Legacy whole-text chunking (non–page-aware). */
    public List<String> chunk(String text) {
        return chunkPages(List.of(new PageSegment(1, text == null ? "" : text))).stream()
                .map(IndexedChunk::text)
                .toList();
    }

    /**
     * Page-aware chunking: each chunk carries page range metadata for citation-style RAG.
     */
    public List<IndexedChunk> chunkPages(List<PageSegment> pages) {
        if (pages == null || pages.isEmpty()) {
            return List.of(new IndexedChunk(0, 0, 0, ""));
        }

        int target = props.getChunkTargetChars();
        int overlap = props.getChunkOverlapChars();
        int maxChunks = props.getMaxChunksPerDocument();

        List<IndexedChunk> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int pageStart = -1;
        int pageEnd = -1;
        int index = 0;

        for (PageSegment page : pages) {
            String para = page.text() == null ? "" : page.text().trim();
            if (para.isBlank()) continue;

            if (pageStart < 0) pageStart = page.pageNumber();
            pageEnd = page.pageNumber();

            if (para.length() > target) {
                flush(chunks, index++, pageStart, pageEnd, current);
                pageStart = page.pageNumber();
                pageEnd = page.pageNumber();
                chunks.addAll(splitLongParagraph(para, page.pageNumber(), index, target, overlap));
                index = chunks.isEmpty() ? 0 : chunks.get(chunks.size() - 1).index() + 1;
                current.setLength(0);
                pageStart = -1;
                pageEnd = -1;
                if (chunks.size() >= maxChunks) return cap(chunks, maxChunks);
                continue;
            }

            if (current.length() + para.length() + 2 > target) {
                flush(chunks, index++, pageStart, pageEnd, current);
                if (chunks.size() >= maxChunks) return cap(chunks, maxChunks);
                if (!chunks.isEmpty() && overlap > 0) {
                    String prev = chunks.get(chunks.size() - 1).text();
                    String tail = prev.length() > overlap ? prev.substring(prev.length() - overlap) : prev;
                    current.append(tail).append("\n\n");
                    pageStart = chunks.get(chunks.size() - 1).pageStart();
                } else {
                    pageStart = page.pageNumber();
                }
                pageEnd = page.pageNumber();
            }

            if (current.length() > 0) current.append("\n\n");
            current.append(para);
            pageEnd = page.pageNumber();
        }

        flush(chunks, index, pageStart, pageEnd, current);
        return cap(chunks, maxChunks);
    }

    private static List<IndexedChunk> cap(List<IndexedChunk> chunks, int max) {
        if (chunks.size() <= max) return chunks;
        return new ArrayList<>(chunks.subList(0, max));
    }

    private void flush(List<IndexedChunk> chunks, int index, int pageStart, int pageEnd, StringBuilder current) {
        if (current.length() > 0 && pageStart > 0) {
            chunks.add(new IndexedChunk(index, pageStart, pageEnd, current.toString().trim()));
            current.setLength(0);
        }
    }

    private List<IndexedChunk> splitLongParagraph(String para, int pageNum, int startIndex, int target, int overlap) {
        List<IndexedChunk> parts = new ArrayList<>();
        int start = 0;
        int idx = startIndex;
        while (start < para.length()) {
            int end = Math.min(start + target, para.length());
            parts.add(new IndexedChunk(idx++, pageNum, pageNum, para.substring(start, end).trim()));
            start = end - overlap;
            if (start < 0) start = 0;
            if (end >= para.length()) break;
        }
        return parts;
    }
}
