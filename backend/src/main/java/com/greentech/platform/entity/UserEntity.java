package com.greentech.platform.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户实体类
 * 对应Supabase Auth用户的扩展信息
 */
@Entity
@Table(name = "users")
public class UserEntity {
    
    @Id
    @Column(name = "id", length = 36)
    private String id; // Supabase Auth UUID
    
    @Column(name = "email", unique = true, length = 255)
    private String email;
    
    @Column(name = "phone", unique = true, length = 20)
    private String phone;
    
    @Column(name = "name", length = 100)
    private String name;
    
    @Column(name = "avatar", length = 500)
    private String avatar;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private UserRole role = UserRole.USER;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private UserStatus status = UserStatus.ACTIVE;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CompanyProfileEntity companyProfile;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 默认构造函数
    public UserEntity() {}
    
    // 构造函数
    public UserEntity(String id, String email, String name) {
        this.id = id;
        this.email = email;
        this.name = name;
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
    
    public UserStatus getStatus() {
        return status;
    }
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }
    
    public CompanyProfileEntity getCompanyProfile() {
        return companyProfile;
    }
    
    public void setCompanyProfile(CompanyProfileEntity companyProfile) {
        this.companyProfile = companyProfile;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}