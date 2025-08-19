package com.greentech.platform.repository;

import com.greentech.platform.entity.CompanyProfileEntity;
import com.greentech.platform.entity.ProfileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 企业信息数据仓库接口
 */
@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfileEntity, Long> {
    
    /**
     * 根据用户ID查找企业信息
     */
    @Query("SELECT cp FROM CompanyProfileEntity cp WHERE cp.user.id = :userId")
    Optional<CompanyProfileEntity> findByUserId(@Param("userId") String userId);
    
    /**
     * 根据企业名称查找企业信息
     */
    List<CompanyProfileEntity> findByCompanyNameContainingIgnoreCase(String companyName);
    
    /**
     * 根据状态查找企业信息
     */
    List<CompanyProfileEntity> findByStatus(ProfileStatus status);
    
    /**
     * 根据国家查找企业信息
     */
    @Query("SELECT cp FROM CompanyProfileEntity cp WHERE cp.country.name = :countryName")
    List<CompanyProfileEntity> findByCountryName(@Param("countryName") String countryName);
    
    /**
     * 根据省份查找企业信息
     */
    @Query("SELECT cp FROM CompanyProfileEntity cp WHERE cp.province.name = :provinceName")
    List<CompanyProfileEntity> findByProvinceName(@Param("provinceName") String provinceName);
    
    /**
     * 根据经济开发区查找企业信息
     */
    @Query("SELECT cp FROM CompanyProfileEntity cp WHERE cp.economicZone.name = :zoneName")
    List<CompanyProfileEntity> findByEconomicZoneName(@Param("zoneName") String zoneName);
    
    /**
     * 检查用户是否已有企业信息
     */
    @Query("SELECT CASE WHEN COUNT(cp) > 0 THEN true ELSE false END FROM CompanyProfileEntity cp WHERE cp.user.id = :userId")
    boolean existsByUserId(@Param("userId") String userId);
}