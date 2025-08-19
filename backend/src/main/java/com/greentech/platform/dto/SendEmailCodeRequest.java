package com.greentech.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 发送邮箱验证码请求
 */
public class SendEmailCodeRequest {
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入正确的邮箱地址")
    private String email;
    
    @NotBlank(message = "验证码用途不能为空")
    private String purpose; // register, login, reset_password
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPurpose() {
        return purpose;
    }
    
    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}