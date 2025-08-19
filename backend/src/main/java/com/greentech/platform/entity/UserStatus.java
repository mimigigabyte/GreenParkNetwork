package com.greentech.platform.entity;

/**
 * 用户状态枚举
 */
public enum UserStatus {
    ACTIVE("活跃"),
    INACTIVE("未激活"),
    SUSPENDED("暂停"),
    DELETED("已删除");
    
    private final String description;
    
    UserStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}