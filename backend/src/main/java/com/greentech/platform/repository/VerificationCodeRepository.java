package com.greentech.platform.repository;

import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.entity.VerificationCodeEntity;
import com.greentech.platform.entity.VerificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 验证码仓库接口
 */
@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCodeEntity, Long> {
    
    /**
     * 根据标识符、类型和用途查找最新的有效验证码
     */
    @Query("SELECT v FROM VerificationCodeEntity v WHERE v.identifier = :identifier " +
           "AND v.type = :type AND v.purpose = :purpose AND v.used = false " +
           "AND v.expiresAt > :now ORDER BY v.createdAt DESC")
    Optional<VerificationCodeEntity> findLatestValidCode(@Param("identifier") String identifier,
                                                        @Param("type") VerificationType type,
                                                        @Param("purpose") CodePurpose purpose,
                                                        @Param("now") LocalDateTime now);
    
    /**
     * 根据标识符、验证码、类型和用途查找验证码
     */
    Optional<VerificationCodeEntity> findByIdentifierAndCodeAndTypeAndPurpose(String identifier,
                                                                              String code,
                                                                              VerificationType type,
                                                                              CodePurpose purpose);
    
    /**
     * 标记验证码为已使用
     */
    @Modifying
    @Transactional
    @Query("UPDATE VerificationCodeEntity v SET v.used = true WHERE v.id = :id")
    void markAsUsed(@Param("id") Long id);
    
    /**
     * 删除过期的验证码
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM VerificationCodeEntity v WHERE v.expiresAt < :now")
    int deleteExpiredCodes(@Param("now") LocalDateTime now);
    
    /**
     * 检查在指定时间内是否已发送验证码（防止频繁发送）
     */
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END FROM VerificationCodeEntity v " +
           "WHERE v.identifier = :identifier AND v.type = :type AND v.purpose = :purpose " +
           "AND v.createdAt > :since")
    boolean existsRecentCode(@Param("identifier") String identifier,
                            @Param("type") VerificationType type,
                            @Param("purpose") CodePurpose purpose,
                            @Param("since") LocalDateTime since);
}