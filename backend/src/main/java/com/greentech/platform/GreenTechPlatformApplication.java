package com.greentech.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 绿色技术平台后端服务主启动类
 * 
 * @author GreenTech Platform Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJpaRepositories
@EnableJpaAuditing
@EnableTransactionManagement
@EnableAsync
@EnableConfigurationProperties
@EnableScheduling
public class GreenTechPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(GreenTechPlatformApplication.class, args);
    }
}