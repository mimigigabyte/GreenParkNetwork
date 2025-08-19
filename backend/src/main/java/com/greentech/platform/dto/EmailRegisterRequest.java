package com.greentech.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 邮箱注册请求
 */
public class EmailRegisterRequest {
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入正确的邮箱地址")
    private String email;
    
    @NotBlank(message = "邮箱验证码不能为空")
    private String emailCode;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在6-20位之间")
    private String password;
    
    @Size(max = 50, message = "用户名长度不能超过50位")
    private String name; // 可选，不传则自动生成
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getEmailCode() {
        return emailCode;
    }
    
    public void setEmailCode(String emailCode) {
        this.emailCode = emailCode;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}