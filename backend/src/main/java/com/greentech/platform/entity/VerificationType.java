package com.greentech.platform.entity;

/**
 * 验证码类型枚举
 */
public enum VerificationType {
    EMAIL("邮箱验证码"),
    SMS("短信验证码"),
    PHONE("手机验证码");
    
    private final String description;
    
    VerificationType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}