package com.greentech.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 企业信息提交请求DTO
 */
public class CompanyProfileRequest {
    
    @NotBlank(message = "需求类型不能为空")
    private String requirement;
    
    @NotBlank(message = "企业名称不能为空")
    @Size(max = 200, message = "企业名称长度不能超过200位")
    private String companyName;
    
    @NotBlank(message = "国家不能为空")
    private String country;
    
    private String province;
    
    private String economicZone;
    
    // 默认构造函数
    public CompanyProfileRequest() {}
    
    // 构造函数
    public CompanyProfileRequest(String requirement, String companyName, String country) {
        this.requirement = requirement;
        this.companyName = companyName;
        this.country = country;
    }
    
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