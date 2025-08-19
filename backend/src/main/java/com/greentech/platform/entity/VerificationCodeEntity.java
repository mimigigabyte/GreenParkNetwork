package com.greentech.platform.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 验证码实体类
 */
@Entity
@Table(name = "verification_codes")
public class VerificationCodeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "identifier", length = 255)
    private String identifier; // email or phone
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private VerificationType type;
    
    @Column(name = "code", length = 10)
    private String code;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", length = 30)
    private CodePurpose purpose;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "used")
    private Boolean used = false;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // 默认构造函数
    public VerificationCodeEntity() {}
    
    // 构造函数
    public VerificationCodeEntity(String identifier, VerificationType type, String code, CodePurpose purpose, LocalDateTime expiresAt) {
        this.identifier = identifier;
        this.type = type;
        this.code = code;
        this.purpose = purpose;
        this.expiresAt = expiresAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getIdentifier() {
        return identifier;
    }
    
    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
    
    public VerificationType getType() {
        return type;
    }
    
    public void setType(VerificationType type) {
        this.type = type;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public CodePurpose getPurpose() {
        return purpose;
    }
    
    public void setPurpose(CodePurpose purpose) {
        this.purpose = purpose;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Boolean getUsed() {
        return used;
    }
    
    public void setUsed(Boolean used) {
        this.used = used;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    /**
     * 检查验证码是否已过期
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    /**
     * 检查验证码是否可用
     */
    public boolean isValid() {
        return !used && !isExpired();
    }
}