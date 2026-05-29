package com.texton.backend.util;

import java.util.OptionalInt;

/**
 * Parsed signals from the user question (page pins, topic focus).
 */
public record QueryIntent(
        String originalQuery,
        OptionalInt targetPage,
        OptionalInt pageRangeStart,
        OptionalInt pageRangeEnd,
        boolean pagePinRequested
) {
    public boolean hasPageFilter() {
        return pagePinRequested && (targetPage.isPresent()
                || (pageRangeStart.isPresent() && pageRangeEnd.isPresent()));
    }
}
