package com.greentech.platform.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 企业信息实体类
 */
@Entity
@Table(name = "company_profiles")
public class CompanyProfileEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "requirement", length = 50)
    private RequirementType requirement;
    
    @Column(name = "company_name", length = 200)
    private String companyName;
    
    @Column(name = "logo_url", length = 500)
    private String logoUrl;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private CountryEntity country;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id")
    private ProvinceEntity province;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "economic_zone_id")
    private EconomicZoneEntity economicZone;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ProfileStatus status = ProfileStatus.PENDING_REVIEW;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 默认构造函数
    public CompanyProfileEntity() {}
    
    // 构造函数
    public CompanyProfileEntity(UserEntity user, RequirementType requirement, String companyName) {
        this.user = user;
        this.requirement = requirement;
        this.companyName = companyName;
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
    
    public RequirementType getRequirement() {
        return requirement;
    }
    
    public void setRequirement(RequirementType requirement) {
        this.requirement = requirement;
    }
    
    public String getCompanyName() {
        return companyName;
    }
    
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
    
    public String getLogoUrl() {
        return logoUrl;
    }
    
    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
    
    public CountryEntity getCountry() {
        return country;
    }
    
    public void setCountry(CountryEntity country) {
        this.country = country;
    }
    
    public ProvinceEntity getProvince() {
        return province;
    }
    
    public void setProvince(ProvinceEntity province) {
        this.province = province;
    }
    
    public EconomicZoneEntity getEconomicZone() {
        return economicZone;
    }
    
    public void setEconomicZone(EconomicZoneEntity economicZone) {
        this.economicZone = economicZone;
    }
    
    public ProfileStatus getStatus() {
        return status;
    }
    
    public void setStatus(ProfileStatus status) {
        this.status = status;
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