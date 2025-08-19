package com.greentech.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Supabase用户同步请求DTO
 */
public class SyncUserRequest {
    
    @NotBlank(message = "用户ID不能为空")
    private String supabaseUserId;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Size(max = 20, message = "手机号长度不能超过20位")
    private String phone;
    
    @NotBlank(message = "用户名称不能为空")
    @Size(max = 100, message = "用户名称长度不能超过100位")
    private String name;
    
    @Size(max = 500, message = "头像URL长度不能超过500位")
    private String avatar;
    
    // 默认构造函数
    public SyncUserRequest() {}
    
    // 构造函数
    public SyncUserRequest(String supabaseUserId, String email, String name) {
        this.supabaseUserId = supabaseUserId;
        this.email = email;
        this.name = name;
    }
    
    // Getters and Setters
    public String getSupabaseUserId() {
        return supabaseUserId;
    }
    
    public void setSupabaseUserId(String supabaseUserId) {
        this.supabaseUserId = supabaseUserId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getAvatar() {
        return avatar;
    }
    
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}