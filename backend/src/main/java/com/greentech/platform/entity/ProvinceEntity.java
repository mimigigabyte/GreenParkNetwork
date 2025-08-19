package com.greentech.platform.entity;

import jakarta.persistence.*;
import java.util.List;

/**
 * 省份实体类
 */
@Entity
@Table(name = "provinces")
public class ProvinceEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "name", length = 100)
    private String name;
    
    @Column(name = "code", length = 10)
    private String code;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private CountryEntity country;
    
    @OneToMany(mappedBy = "province", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EconomicZoneEntity> economicZones;
    
    @OneToMany(mappedBy = "province", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CompanyProfileEntity> companyProfiles;
    
    // 默认构造函数
    public ProvinceEntity() {}
    
    // 构造函数
    public ProvinceEntity(String name, String code, CountryEntity country) {
        this.name = name;
        this.code = code;
        this.country = country;
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
    
    public CountryEntity getCountry() {
        return country;
    }
    
    public void setCountry(CountryEntity country) {
        this.country = country;
    }
    
    public List<EconomicZoneEntity> getEconomicZones() {
        return economicZones;
    }
    
    public void setEconomicZones(List<EconomicZoneEntity> economicZones) {
        this.economicZones = economicZones;
    }
    
    public List<CompanyProfileEntity> getCompanyProfiles() {
        return companyProfiles;
    }
    
    public void setCompanyProfiles(List<CompanyProfileEntity> companyProfiles) {
        this.companyProfiles = companyProfiles;
    }
}