package com.greentech.platform.repository;

import com.greentech.platform.entity.CountryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 国家数据仓库接口
 */
@Repository
public interface CountryRepository extends JpaRepository<CountryEntity, Long> {
    
    /**
     * 根据国家名称查找国家
     */
    Optional<CountryEntity> findByName(String name);
    
    /**
     * 根据国家代码查找国家
     */
    Optional<CountryEntity> findByCode(String code);
    
    /**
     * 检查国家名称是否存在
     */
    boolean existsByName(String name);
    
    /**
     * 检查国家代码是否存在
     */
    boolean existsByCode(String code);
}