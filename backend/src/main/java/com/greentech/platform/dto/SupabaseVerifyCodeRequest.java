package com.greentech.platform.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Supabase 验证码验证请求
 */
public class SupabaseVerifyCodeRequest {
    
    @NotBlank(message = "验证码不能为空")
    private String code;
    
    private String phone;
    private String email;
    
    @NotBlank(message = "验证码用途不能为空")
    private String purpose; // register, login, reset_password
    
    private String countryCode = "+86";
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
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
    
    public String getCountryCode() {
        return countryCode;
    }
    
    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}