package com.greentech.platform.entity;

/**
 * 用户角色枚举
 */
public enum UserRole {
    USER("普通用户"),
    ADMIN("管理员");
    
    private final String description;
    
    UserRole(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}