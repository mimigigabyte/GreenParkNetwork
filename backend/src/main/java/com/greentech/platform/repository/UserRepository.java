package com.greentech.platform.repository;

import com.greentech.platform.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户仓库接口
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    
    /**
     * 根据邮箱查找用户
     */
    Optional<UserEntity> findByEmail(String email);
    
    /**
     * 根据手机号查找用户
     */
    Optional<UserEntity> findByPhone(String phone);
    
    /**
     * 根据邮箱或手机号查找用户
     */
    @Query("SELECT u FROM UserEntity u WHERE u.email = :account OR u.phone = :account")
    Optional<UserEntity> findByEmailOrPhone(@Param("account") String account);
    
    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);
    
    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);
    
    /**
     * 根据邮箱或手机号检查用户是否存在
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM UserEntity u WHERE u.email = :account OR u.phone = :account")
    boolean existsByEmailOrPhone(@Param("account") String account);
}