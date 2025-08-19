package com.greentech.platform.entity;

/**
 * 验证码用途枚举
 */
public enum CodePurpose {
    REGISTER("注册验证"),
    LOGIN("登录验证"),
    FORGOT_PASSWORD("忘记密码"),
    RESET_PASSWORD("重置密码"),
    CHANGE_EMAIL("更换邮箱"),
    CHANGE_PHONE("更换手机号");
    
    private final String description;
    
    CodePurpose(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}