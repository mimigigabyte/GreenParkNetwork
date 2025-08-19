package com.greentech.platform.dto;

import com.greentech.platform.entity.UserEntity;

/**
 * 认证响应DTO
 */
public class AuthResponse {
    
    private UserDto user;
    private String token;
    private String refreshToken;
    private String accessToken;
    private String tokenType;
    private int expiresIn;
    
    // 默认构造函数
    public AuthResponse() {}
    
    // 构造函数
    public AuthResponse(UserDto user, String token, String refreshToken) {
        this.user = user;
        this.token = token;
        this.refreshToken = refreshToken;
    }
    
    // Getters and Setters
    public UserDto getUser() {
        return user;
    }
    
    public void setUser(UserDto user) {
        this.user = user;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public String getTokenType() {
        return tokenType;
    }
    
    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }
    
    public int getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(int expiresIn) {
        this.expiresIn = expiresIn;
    }
}