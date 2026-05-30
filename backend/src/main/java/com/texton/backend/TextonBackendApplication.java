package com.texton.backend;

import com.texton.backend.config.DocumentIndexingProperties;
import com.texton.backend.config.EncryptionProperties;
import com.texton.backend.config.SecurityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableConfigurationProperties({DocumentIndexingProperties.class, SecurityProperties.class, EncryptionProperties.class})
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class TextonBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(TextonBackendApplication.class, args);
    }
}
