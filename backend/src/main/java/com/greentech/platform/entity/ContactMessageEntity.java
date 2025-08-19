package com.greentech.platform.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 联系消息实体类
 */
@Entity
@Table(name = "contact_messages")
public class ContactMessageEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;
    
    @Column(name = "technology_id", length = 50)
    private String technologyId;
    
    @Column(name = "technology_name", length = 500)
    private String technologyName;
    
    @Column(name = "company_name", length = 200)
    private String companyName;
    
    @Column(name = "contact_name", length = 100, nullable = false)
    private String contactName;
    
    @Column(name = "contact_phone", length = 20, nullable = false)
    private String contactPhone;
    
    @Column(name = "contact_email", length = 255, nullable = false)
    private String contactEmail;
    
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ContactMessageStatus status = ContactMessageStatus.PENDING;
    
    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;
    
    @Column(name = "admin_id", length = 36)
    private String adminId;
    
    @Column(name = "replied_at")
    private LocalDateTime repliedAt;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 默认构造函数
    public ContactMessageEntity() {}
    
    // 构造函数
    public ContactMessageEntity(UserEntity user, String technologyId, String technologyName, 
                               String contactName, String contactPhone, String contactEmail, String message) {
        this.user = user;
        this.technologyId = technologyId;
        this.technologyName = technologyName;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.contactEmail = contactEmail;
        this.message = message;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public UserEntity getUser() {
        return user;
    }
    
    public void setUser(UserEntity user) {
        this.user = user;
    }
    
    public String getTechnologyId() {
        return technologyId;
    }
    
    public void setTechnologyId(String technologyId) {
        this.technologyId = technologyId;
    }
    
    public String getTechnologyName() {
        return technologyName;
    }
    
    public void setTechnologyName(String technologyName) {
        this.technologyName = technologyName;
    }
    
    public String getCompanyName() {
        return companyName;
    }
    
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public String getContactEmail() {
        return contactEmail;
    }
    
    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public ContactMessageStatus getStatus() {
        return status;
    }
    
    public void setStatus(ContactMessageStatus status) {
        this.status = status;
    }
    
    public String getAdminReply() {
        return adminReply;
    }
    
    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }
    
    public String getAdminId() {
        return adminId;
    }
    
    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }
    
    public LocalDateTime getRepliedAt() {
        return repliedAt;
    }
    
    public void setRepliedAt(LocalDateTime repliedAt) {
        this.repliedAt = repliedAt;
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