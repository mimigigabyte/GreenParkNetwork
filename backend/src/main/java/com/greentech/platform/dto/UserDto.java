package com.greentech.platform.dto;

import com.greentech.platform.entity.UserEntity;
import com.greentech.platform.entity.UserRole;
import com.greentech.platform.entity.UserStatus;

import java.time.LocalDateTime;

/**
 * 用户信息DTO
 */
public class UserDto {
    
    private String id;
    private String email;
    private String phone;
    private String name;
    private String avatar;
    private UserRole role;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean emailVerified;
    private boolean phoneVerified;
    private CompanyProfileDto companyProfile;
    
    // 默认构造函数
    public UserDto() {}
    
    // 从UserEntity转换
    public UserDto(UserEntity userEntity) {
        this.id = userEntity.getId();
        this.email = userEntity.getEmail();
        this.phone = userEntity.getPhone();
        this.name = userEntity.getName();
        this.avatar = userEntity.getAvatar();
        this.role = userEntity.getRole();
        this.status = userEntity.getStatus();
        this.createdAt = userEntity.getCreatedAt();
        this.updatedAt = userEntity.getUpdatedAt();
        // TODO: 从相关表或服务获取验证状态
        this.emailVerified = userEntity.getEmail() != null;
        this.phoneVerified = userEntity.getPhone() != null;
        // 如果有关联的企业档案，转换为DTO
        if (userEntity.getCompanyProfile() != null) {
            this.companyProfile = new CompanyProfileDto(userEntity.getCompanyProfile());
        }
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
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
    
    public UserRole getRole() {
        return role;
    }
    
    public void setRole(UserRole role) {
        this.role = role;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public boolean isEmailVerified() {
        return emailVerified;
    }
    
    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
    
    public boolean isPhoneVerified() {
        return phoneVerified;
    }
    
    public void setPhoneVerified(boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }
    
    public UserStatus getStatus() {
        return status;
    }
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public CompanyProfileDto getCompanyProfile() {
        return companyProfile;
    }
    
    public void setCompanyProfile(CompanyProfileDto companyProfile) {
        this.companyProfile = companyProfile;
    }
}