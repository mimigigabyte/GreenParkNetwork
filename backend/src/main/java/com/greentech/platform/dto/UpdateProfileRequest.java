package com.greentech.platform.dto;

import jakarta.validation.constraints.Size;

/**
 * 更新企业信息请求DTO
 */
public class UpdateProfileRequest {
    
    private String requirement;
    
    @Size(max = 200, message = "企业名称长度不能超过200位")
    private String companyName;
    
    private String country;
    
    private String province;
    
    private String economicZone;
    
    // 默认构造函数
    public UpdateProfileRequest() {}
    
    // Getters and Setters
    public String getRequirement() {
        return requirement;
    }
    
    public void setRequirement(String requirement) {
        this.requirement = requirement;
    }
    
    public String getCompanyName() {
        return companyName;
    }
    
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getProvince() {
        return province;
    }
    
    public void setProvince(String province) {
        this.province = province;
    }
    
    public String getEconomicZone() {
        return economicZone;
    }
    
    public void setEconomicZone(String economicZone) {
        this.economicZone = economicZone;
    }
}