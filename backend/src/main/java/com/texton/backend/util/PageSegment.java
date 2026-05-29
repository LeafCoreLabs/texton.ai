package com.texton.backend.util;

/**
 * Text extracted from a single page (PDF) or logical section (other formats).
 */
public record PageSegment(int pageNumber, String text) {}
