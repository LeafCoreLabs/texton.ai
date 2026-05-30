package com.texton.backend.util;

import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public final class DocumentFileValidator {

    /** Large textbooks / scanned volumes — see texton.indexing.max-upload-mb */
    private static final long MAX_BYTES = 250L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf",
            "doc", "docx", "dot", "dotx",
            "odt", "rtf",
            "txt", "md", "csv", "tsv",
            "json", "xml", "html", "htm",
            "xls", "xlsx", "xlsm", "ods",
            "ppt", "pptx", "odp",
            "epub",
            "pages", "numbers", "key"
    );

    private DocumentFileValidator() {}

    public static String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "No file provided or file is empty.";
        }
        if (file.getSize() > MAX_BYTES) {
            return "File exceeds maximum size of 250 MB.";
        }
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            return "File name is required.";
        }
        String ext = extension(name);
        if (ext.isEmpty() || !ALLOWED_EXTENSIONS.contains(ext)) {
            return "Unsupported file type. Supported: PDF, Word, Excel, PowerPoint, "
                    + "OpenDocument, RTF, HTML, plain text, Markdown, CSV, EPUB, and similar document formats.";
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String lower = contentType.toLowerCase();
            if (lower.startsWith("image/") || lower.startsWith("video/") || lower.startsWith("audio/")
                    || lower.contains("javascript") || lower.contains("octet-stream")) {
                if (!lower.contains("pdf") && !ext.equals("pdf")) {
                    return "File content type does not match an allowed document format.";
                }
            }
        }
        return null;
    }

    private static String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}
