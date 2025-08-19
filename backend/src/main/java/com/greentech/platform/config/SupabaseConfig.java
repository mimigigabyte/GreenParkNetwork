package com.greentech.platform.config;

import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Supabase配置类
 */
@Configuration
@ConfigurationProperties(prefix = "supabase")
public class SupabaseConfig {
    
    private String url;
    private String anonKey;
    private String serviceRoleKey;
    
    @Bean
    public OkHttpClient supabaseHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(30))
                .writeTimeout(Duration.ofSeconds(30))
                .build();
    }
    
    // Getters and Setters
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getAnonKey() {
        return anonKey;
    }
    
    public void setAnonKey(String anonKey) {
        this.anonKey = anonKey;
    }
    
    public String getServiceRoleKey() {
        return serviceRoleKey;
    }
    
    public void setServiceRoleKey(String serviceRoleKey) {
        this.serviceRoleKey = serviceRoleKey;
    }
}