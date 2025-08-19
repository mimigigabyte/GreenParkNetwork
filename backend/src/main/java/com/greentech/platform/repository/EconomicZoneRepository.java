package com.greentech.platform.repository;

import com.greentech.platform.entity.EconomicZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 经济开发区数据仓库接口
 */
@Repository
public interface EconomicZoneRepository extends JpaRepository<EconomicZoneEntity, Long> {
    
    /**
     * 根据经济开发区名称查找
     */
    Optional<EconomicZoneEntity> findByName(String name);
    
    /**
     * 根据经济开发区代码查找
     */
    Optional<EconomicZoneEntity> findByCode(String code);
    
    /**
     * 根据省份ID查找所有经济开发区
     */
    @Query("SELECT ez FROM EconomicZoneEntity ez WHERE ez.province.id = :provinceId")
    List<EconomicZoneEntity> findByProvinceId(@Param("provinceId") Long provinceId);
    
    /**
     * 根据省份名称查找所有经济开发区
     */
    @Query("SELECT ez FROM EconomicZoneEntity ez WHERE ez.province.name = :provinceName")
    List<EconomicZoneEntity> findByProvinceName(@Param("provinceName") String provinceName);
    
    /**
     * 检查经济开发区名称在指定省份中是否存在
     */
    @Query("SELECT CASE WHEN COUNT(ez) > 0 THEN true ELSE false END FROM EconomicZoneEntity ez " +
           "WHERE ez.name = :name AND ez.province.id = :provinceId")
    boolean existsByNameAndProvinceId(@Param("name") String name, @Param("provinceId") Long provinceId);
}