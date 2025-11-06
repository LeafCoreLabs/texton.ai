package com.texton.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAsync
@EnableAspectJAutoProxy(proxyTargetClass = true)  // ✅ Forces CGLIB instead of JDK proxy
public class TextonBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(TextonBackendApplication.class, args);
    }
}
