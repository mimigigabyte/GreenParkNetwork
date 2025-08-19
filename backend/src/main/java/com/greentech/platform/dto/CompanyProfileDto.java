package com.greentech.platform.dto;

import com.greentech.platform.entity.CompanyProfileEntity;
import com.greentech.platform.entity.ProfileStatus;
import com.greentech.platform.entity.RequirementType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * 企业信息响应DTO
 */
public class CompanyProfileDto {
    
    private Long id;
    private String userId;
    private RequirementType requirement;
    private String companyName;
    private String logoUrl;
    private String countryName;
    private String provinceName;
    private String economicZoneName;
    private ProfileStatus status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 默认构造函数
    public CompanyProfileDto() {}
    
    // 构造函数
    public CompanyProfileDto(Long id, String userId, RequirementType requirement, String companyName) {
        this.id = id;
        this.userId = userId;
        this.requirement = requirement;
        this.companyName = companyName;
    }
    
    // 从CompanyProfileEntity转换的构造函数
    public CompanyProfileDto(CompanyProfileEntity entity) {
        this.id = entity.getId();
        this.userId = entity.getUser() != null ? entity.getUser().getId() : null;
        this.requirement = entity.getRequirement();
        this.companyName = entity.getCompanyName();
        this.logoUrl = entity.getLogoUrl();
        this.countryName = entity.getCountry() != null ? entity.getCountry().getName() : null;
        this.provinceName = entity.getProvince() != null ? entity.getProvince().getName() : null;
        this.economicZoneName = entity.getEconomicZone() != null ? entity.getEconomicZone().getName() : null;
        this.status = entity.getStatus();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
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
    
    public String getCountryName() {
        return countryName;
    }
    
    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }
    
    public String getProvinceName() {
        return provinceName;
    }
    
    public void setProvinceName(String provinceName) {
        this.provinceName = provinceName;
    }
    
    public String getEconomicZoneName() {
        return economicZoneName;
    }
    
    public void setEconomicZoneName(String economicZoneName) {
        this.economicZoneName = economicZoneName;
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