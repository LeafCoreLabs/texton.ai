package com.texton.backend;

import com.texton.backend.config.DocumentIndexingProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties(DocumentIndexingProperties.class)
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class TextonBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(TextonBackendApplication.class, args);
    }
}
