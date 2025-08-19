package com.greentech.platform.entity;

import jakarta.persistence.*;
import java.util.List;

/**
 * 经济开发区实体类
 */
@Entity
@Table(name = "economic_zones")
public class EconomicZoneEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "name", length = 200)
    private String name;
    
    @Column(name = "code", length = 20)
    private String code;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id")
    private ProvinceEntity province;
    
    @OneToMany(mappedBy = "economicZone", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CompanyProfileEntity> companyProfiles;
    
    // 默认构造函数
    public EconomicZoneEntity() {}
    
    // 构造函数
    public EconomicZoneEntity(String name, String code, ProvinceEntity province) {
        this.name = name;
        this.code = code;
        this.province = province;
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
    
    public ProvinceEntity getProvince() {
        return province;
    }
    
    public void setProvince(ProvinceEntity province) {
        this.province = province;
    }
    
    public List<CompanyProfileEntity> getCompanyProfiles() {
        return companyProfiles;
    }
    
    public void setCompanyProfiles(List<CompanyProfileEntity> companyProfiles) {
        this.companyProfiles = companyProfiles;
    }
}