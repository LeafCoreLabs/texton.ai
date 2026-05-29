package com.texton.backend.util;

import com.texton.backend.config.DocumentIndexingProperties;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class PageAwareExtractor {

    private final Tika tika = new Tika();

    @Autowired
    private DocumentIndexingProperties props;

    public ExtractionResult extract(byte[] fileBytes, String fileName) throws Exception {
        String ext = extension(fileName);
        if ("pdf".equals(ext)) {
            return extractPdf(fileBytes);
        }
        return extractWholeDocument(fileBytes);
    }

    private ExtractionResult extractPdf(byte[] fileBytes) throws Exception {
        List<PageSegment> pages = new ArrayList<>();
        boolean truncated = false;

        try (PDDocument pdf = PDDocument.load(fileBytes)) {
            int total = pdf.getNumberOfPages();
            int limit = Math.min(total, props.getMaxPages());
            truncated = total > limit;

            PDFTextStripper stripper = new PDFTextStripper();
            for (int p = 1; p <= limit; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String text = stripper.getText(pdf);
                if (text == null) text = "";
                text = text.replace("\r\n", "\n").trim();
                if (text.length() >= props.getMinPageChars()) {
                    pages.add(new PageSegment(p, text));
                }
            }
            return new ExtractionResult(pages, limit, total, truncated);
        }
    }

    private ExtractionResult extractWholeDocument(byte[] fileBytes) throws Exception {
        String text = tika.parseToString(new ByteArrayInputStream(fileBytes));
        if (text == null) text = "";
        text = text.replace("\r\n", "\n").trim();
        List<PageSegment> pages = new ArrayList<>();
        if (!text.isBlank()) {
            pages.add(new PageSegment(1, text));
        }
        return new ExtractionResult(pages, pages.size(), pages.size(), false);
    }

    private static String extension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) return "";
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    public record ExtractionResult(
            List<PageSegment> pages,
            int pagesIndexed,
            int pagesDetected,
            boolean truncatedByLimit
    ) {}
}
