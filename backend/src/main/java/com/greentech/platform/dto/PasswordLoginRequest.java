package com.greentech.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 密码登录请求DTO
 */
public class PasswordLoginRequest {
    
    @NotBlank(message = "账号不能为空")
    private String account;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotBlank(message = "账号类型不能为空")
    @Pattern(regexp = "^(email|phone)$", message = "账号类型只能是email或phone")
    private String type;
    
    // 默认构造函数
    public PasswordLoginRequest() {}
    
    // 构造函数
    public PasswordLoginRequest(String account, String password, String type) {
        this.account = account;
        this.password = password;
        this.type = type;
    }
    
    // Getters and Setters
    public String getAccount() {
        return account;
    }
    
    public void setAccount(String account) {
        this.account = account;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
}