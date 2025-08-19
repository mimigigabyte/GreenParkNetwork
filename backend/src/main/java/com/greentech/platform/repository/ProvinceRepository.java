package com.greentech.platform.repository;

import com.greentech.platform.entity.ProvinceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 省份数据仓库接口
 */
@Repository
public interface ProvinceRepository extends JpaRepository<ProvinceEntity, Long> {
    
    /**
     * 根据省份名称查找省份
     */
    Optional<ProvinceEntity> findByName(String name);
    
    /**
     * 根据省份代码查找省份
     */
    Optional<ProvinceEntity> findByCode(String code);
    
    /**
     * 根据国家ID查找所有省份
     */
    @Query("SELECT p FROM ProvinceEntity p WHERE p.country.id = :countryId")
    List<ProvinceEntity> findByCountryId(@Param("countryId") Long countryId);
    
    /**
     * 根据国家名称查找所有省份
     */
    @Query("SELECT p FROM ProvinceEntity p WHERE p.country.name = :countryName")
    List<ProvinceEntity> findByCountryName(@Param("countryName") String countryName);
    
    /**
     * 检查省份名称在指定国家中是否存在
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM ProvinceEntity p " +
           "WHERE p.name = :name AND p.country.id = :countryId")
    boolean existsByNameAndCountryId(@Param("name") String name, @Param("countryId") Long countryId);
}