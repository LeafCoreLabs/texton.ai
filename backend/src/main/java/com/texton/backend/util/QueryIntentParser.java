package com.texton.backend.util;

import java.util.OptionalInt;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class QueryIntentParser {

    private static final Pattern PAGE_RANGE = Pattern.compile(
            "(?i)(?:pages?|pp?\\.?)\\s*(\\d{1,5})\\s*[-–—to]+\\s*(\\d{1,5})");
    private static final Pattern SINGLE_PAGE = Pattern.compile(
            "(?i)(?:page|pg\\.?|p\\.?)\\s*#?\\s*(\\d{1,5})\\b|"
                    + "\\bon\\s+page\\s+(\\d{1,5})\\b|"
                    + "\\bpage\\s+number\\s+(\\d{1,5})\\b");

    private QueryIntentParser() {}

    public static QueryIntent parse(String query) {
        if (query == null) query = "";
        String q = query.trim();

        Matcher range = PAGE_RANGE.matcher(q);
        if (range.find()) {
            int a = Integer.parseInt(range.group(1));
            int b = Integer.parseInt(range.group(2));
            int start = Math.min(a, b);
            int end = Math.max(a, b);
            return new QueryIntent(q, OptionalInt.empty(), OptionalInt.of(start), OptionalInt.of(end), true);
        }

        Matcher single = SINGLE_PAGE.matcher(q);
        if (single.find()) {
            String num = single.group(1) != null ? single.group(1)
                    : single.group(2) != null ? single.group(2) : single.group(3);
            int page = Integer.parseInt(num);
            return new QueryIntent(q, OptionalInt.of(page), OptionalInt.empty(), OptionalInt.empty(), true);
        }

        return new QueryIntent(q, OptionalInt.empty(), OptionalInt.empty(), OptionalInt.empty(), false);
    }
}
