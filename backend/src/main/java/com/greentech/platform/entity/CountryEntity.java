package com.greentech.platform.entity;

import jakarta.persistence.*;
import java.util.List;

/**
 * 国家实体类
 */
@Entity
@Table(name = "countries")
public class CountryEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "name", unique = true, length = 100)
    private String name;
    
    @Column(name = "code", unique = true, length = 10)
    private String code;
    
    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProvinceEntity> provinces;
    
    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CompanyProfileEntity> companyProfiles;
    
    // 默认构造函数
    public CountryEntity() {}
    
    // 构造函数
    public CountryEntity(String name, String code) {
        this.name = name;
        this.code = code;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public List<ProvinceEntity> getProvinces() {
        return provinces;
    }
    
    public void setProvinces(List<ProvinceEntity> provinces) {
        this.provinces = provinces;
    }
    
    public List<CompanyProfileEntity> getCompanyProfiles() {
        return companyProfiles;
    }
    
    public void setCompanyProfiles(List<CompanyProfileEntity> companyProfiles) {
        this.companyProfiles = companyProfiles;
    }
}