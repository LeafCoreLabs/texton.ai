package com.texton.backend.service;

import com.texton.backend.models.Document;
import com.texton.backend.models.User;
import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentService implements UserDetailsService { // Implements UserDetailsService here to save a file

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository; 
    
    @Autowired
    private S3Service s3Service; 
    @Autowired
    private ParsingService parsingService;

    // --- UserDetailsService Implementation (CRITICAL for Spring Security) ---
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> userDetail = userRepository.findByUsername(username);
        return userDetail.orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // --- CRUCIAL USER LOOKUP ---
    public User getUserByUsername(String username) {
        // Safe to cast UserDetails here since loadUserByUsername returns User
        return (User) loadUserByUsername(username);
    }

    // --- Document Handlers ---
    public List<Document> getDocumentsByUserId(Long userId) {
        return documentRepository.findByUserIdOrderByUploadDateDesc(userId);
    }
    
    public Document uploadAndProcessDocument(MultipartFile file, String username) {
        User user = getUserByUsername(username);

        String s3Key = s3Service.uploadFile(file, user.getId()); 

        Document doc = new Document();
        doc.setUser(user);
        doc.setFileName(file.getOriginalFilename());
        doc.setS3Key(s3Key);
        doc.setStatus(Document.DocumentStatus.PROCESSING);
        doc.setSizeInKB(file.getSize() / 1024);
        Document savedDoc = documentRepository.save(doc);

        parsingService.startProcessing(savedDoc.getId()); 

        return savedDoc;
    }

    public String queryDocument(Long documentId, String query, String username) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found."));

        if (!doc.getUser().getUsername().equals(username)) {
            throw new SecurityException("Access Denied: User does not own this document.");
        }

        if (doc.getStatus() != Document.DocumentStatus.PROCESSED) {
            return "Document is currently " + doc.getStatus().name() + ". Please wait until processing is complete.";
        }
        
        return "Gemini AI Answer: The key takeaway from the document '" + doc.getFileName() + 
               "' regarding your query is derived from vector search.";
    }
}
