package com.greentech.platform.config;

import com.resend.Resend;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 邮件服务配置类
 */
@Configuration
@ConfigurationProperties(prefix = "resend")
public class EmailConfig {
    
    private String apiKey;
    private String fromEmail;
    
    @Bean
    public Resend resendClient() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            // 如果没有配置API Key，返回一个空的客户端
            // 这样可以避免应用启动失败，而在发送邮件时进行检查
            return null;
        }
        return new Resend(apiKey);
    }
    
    // Getters and Setters
    public String getApiKey() {
        return apiKey;
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
    
    public String getFromEmail() {
        return fromEmail;
    }
    
    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }
}