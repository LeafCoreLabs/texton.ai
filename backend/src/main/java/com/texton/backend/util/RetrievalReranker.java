package com.texton.backend.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Hybrid retrieval over all chunks: multi-vector cosine max, BM25, page pinning, phrase boost.
 */
public final class RetrievalReranker {

    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^a-zA-Z0-9]+");
    private static final Pattern QUOTED = Pattern.compile("[\"']([^\"']{3,80})[\"']");

    private RetrievalReranker() {}

    public static Result rerank(
            String query,
            QueryIntent intent,
            List<IndexedChunk> chunks,
            List<List<Double>> chunkVectors,
            List<List<Double>> queryVectors,
            int retrieveK,
            int finalK,
            Set<Integer> mandatoryIndices
    ) {
        if (chunks == null || chunks.isEmpty()) {
            return new Result(List.of(), 0.0);
        }

        Set<String> queryTerms = tokenize(query);
        List<String> phrases = extractPhrases(query);
        double avgLen = chunks.stream().mapToInt(c -> c.text().length()).average().orElse(800.0);
        Map<String, Integer> docFreq = documentFrequency(chunks);

        List<Scored> scored = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            double cosine = multiVectorMaxCosine(queryVectors, chunkVectors, i);
            double bm25 = bm25Score(queryTerms, chunks.get(i).text(), avgLen, docFreq, chunks.size());
            double lexical = lexicalScore(queryTerms, chunks.get(i).text());
            double phrase = phraseBoost(phrases, chunks.get(i).text());
            double page = pageBoost(intent, chunks.get(i));
            double mandatory = mandatoryIndices != null && mandatoryIndices.contains(i) ? 0.35 : 0.0;

            double combined = 0.38 * cosine + 0.32 * bm25 + 0.12 * lexical + 0.08 * phrase + page + mandatory;
            combined = Math.min(1.0, combined);
            scored.add(new Scored(i, combined, cosine, bm25));
        }

        scored.sort((a, b) -> Double.compare(b.combined, a.combined));
        double topConfidence = scored.isEmpty() ? 0.0 : scored.get(0).combined;

        int take = Math.min(retrieveK, scored.size());
        List<Scored> pool = new ArrayList<>(scored.subList(0, take));

        if (mandatoryIndices != null) {
            for (int idx : mandatoryIndices) {
                if (idx >= 0 && idx < chunks.size()) {
                    boolean inPool = pool.stream().anyMatch(s -> s.index == idx);
                    if (!inPool) {
                        Scored s = scored.stream().filter(x -> x.index == idx).findFirst()
                                .orElse(new Scored(idx, 0.9, 0.5, 0.5));
                        pool.add(0, s);
                    }
                }
            }
        }

        List<Integer> picked = mmrSelect(pool, chunks, finalK);

        List<String> excerpts = picked.stream()
                .map(i -> chunks.get(i).forRetrieval())
                .collect(Collectors.toList());

        return new Result(excerpts, topConfidence);
    }

    private static List<Integer> mmrSelect(List<Scored> pool, List<IndexedChunk> chunks, int finalK) {
        List<Integer> picked = new ArrayList<>();
        Set<String> seenPrefixes = new HashSet<>();
        for (Scored s : pool) {
            if (picked.size() >= finalK) break;
            String text = chunks.get(s.index).text();
            String prefix = text.substring(0, Math.min(100, text.length()));
            if (seenPrefixes.add(prefix)) picked.add(s.index);
        }
        for (Scored s : pool) {
            if (picked.size() >= finalK) break;
            if (!picked.contains(s.index)) picked.add(s.index);
        }
        return picked;
    }

    private static double multiVectorMaxCosine(
            List<List<Double>> queryVectors,
            List<List<Double>> chunkVectors,
            int chunkIndex
    ) {
        if (chunkVectors == null || chunkIndex >= chunkVectors.size()) return 0;
        List<Double> chunk = chunkVectors.get(chunkIndex);
        double best = 0;
        if (queryVectors != null) {
            for (List<Double> qv : queryVectors) {
                best = Math.max(best, cosineSimilarity(qv, chunk));
            }
        }
        return best;
    }

    private static double pageBoost(QueryIntent intent, IndexedChunk chunk) {
        if (intent == null || !intent.hasPageFilter()) return 0;
        if (intent.targetPage().isPresent()) {
            int p = intent.targetPage().getAsInt();
            if (chunk.coversPage(p)) return 0.4;
            if (chunk.coversPage(p - 1) || chunk.coversPage(p + 1)) return 0.15;
        }
        if (intent.pageRangeStart().isPresent() && intent.pageRangeEnd().isPresent()) {
            int lo = intent.pageRangeStart().getAsInt();
            int hi = intent.pageRangeEnd().getAsInt();
            if (chunk.pageEnd() >= lo && chunk.pageStart() <= hi) return 0.35;
        }
        return 0;
    }

    private static double phraseBoost(List<String> phrases, String text) {
        if (phrases.isEmpty() || text == null) return 0;
        String lower = text.toLowerCase(Locale.ROOT);
        long hits = phrases.stream().filter(p -> lower.contains(p.toLowerCase(Locale.ROOT))).count();
        return phrases.isEmpty() ? 0 : (double) hits / phrases.size() * 0.25;
    }

    private static List<String> extractPhrases(String query) {
        List<String> out = new ArrayList<>();
        Matcher m = QUOTED.matcher(query);
        while (m.find()) out.add(m.group(1).trim());
        return out;
    }

    private static Map<String, Integer> documentFrequency(List<IndexedChunk> chunks) {
        Map<String, Integer> df = new HashMap<>();
        for (IndexedChunk c : chunks) {
            for (String t : tokenize(c.text())) {
                df.merge(t, 1, Integer::sum);
            }
        }
        return df;
    }

    private static double bm25Score(
            Set<String> queryTerms,
            String docText,
            double avgDocLen,
            Map<String, Integer> df,
            int totalDocs
    ) {
        if (queryTerms.isEmpty() || docText == null) return 0;
        Set<String> docTerms = tokenize(docText);
        int docLen = docText.length();
        double k1 = 1.2;
        double b = 0.75;
        double score = 0;
        for (String term : queryTerms) {
            if (!docTerms.contains(term)) continue;
            int freq = termFrequency(docText, term);
            int dfi = df.getOrDefault(term, 0);
            double idf = Math.log(1 + (totalDocs - dfi + 0.5) / (dfi + 0.5));
            double num = freq * (k1 + 1);
            double den = freq + k1 * (1 - b + b * docLen / avgDocLen);
            score += idf * (num / den);
        }
        return score / Math.max(1, queryTerms.size());
    }

    private static Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Set.of();
        return Arrays.stream(TOKEN_SPLIT.split(text.toLowerCase(Locale.ROOT)))
                .filter(t -> t.length() > 2)
                .limit(50)
                .collect(Collectors.toSet());
    }

    private static double lexicalScore(Set<String> queryTerms, String chunkText) {
        if (queryTerms.isEmpty() || chunkText == null || chunkText.isBlank()) return 0;
        Set<String> chunkTerms = tokenize(chunkText);
        if (chunkTerms.isEmpty()) return 0;
        long hits = queryTerms.stream().filter(chunkTerms::contains).count();
        return (double) hits / queryTerms.size();
    }

    private static int termFrequency(String docText, String term) {
        if (docText == null || term == null || term.isBlank()) return 0;
        String lower = docText.toLowerCase(Locale.ROOT);
        String t = term.toLowerCase(Locale.ROOT);
        int count = 0;
        int idx = 0;
        while ((idx = lower.indexOf(t, idx)) >= 0) {
            count++;
            idx += Math.max(1, t.length());
        }
        return count;
    }

    private static double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a == null || b == null) return 0;
        int len = Math.min(a.size(), b.size());
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < len; i++) {
            dot += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }
        double denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom == 0 ? 0 : dot / denom;
    }

    public record Result(List<String> excerpts, double confidence) {}

    private record Scored(int index, double combined, double cosine, double bm25) {}
}
