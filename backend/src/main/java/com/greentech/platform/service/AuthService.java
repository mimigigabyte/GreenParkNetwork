package com.greentech.platform.service;

import com.greentech.platform.config.SupabaseConfig;
import com.greentech.platform.dto.CompanyProfileDto;
import com.greentech.platform.dto.SyncUserRequest;
import com.greentech.platform.dto.UserDto;
import com.greentech.platform.entity.CompanyProfileEntity;
import com.greentech.platform.entity.UserEntity;
import com.greentech.platform.entity.UserRole;
import com.greentech.platform.entity.UserStatus;
import com.greentech.platform.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * 认证服务类
 */
@Service
@Transactional
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SupabaseConfig supabaseConfig;
    
    @Autowired
    private OkHttpClient supabaseHttpClient;
    
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    
    /**
     * Supabase用户同步到本地数据库
     */
    public UserDto syncSupabaseUser(SyncUserRequest request) {
        try {
            // 检查用户是否已存在
            Optional<UserEntity> existingUser = userRepository.findById(request.getSupabaseUserId());
            
            UserEntity user;
            if (existingUser.isPresent()) {
                // 更新现有用户信息
                user = existingUser.get();
                user.setEmail(request.getEmail());
                user.setPhone(request.getPhone());
                user.setName(request.getName());
                user.setAvatar(request.getAvatar());
                logger.info("更新用户信息: {}", user.getId());
            } else {
                // 创建新用户
                user = new UserEntity();
                user.setId(request.getSupabaseUserId());
                user.setEmail(request.getEmail());
                user.setPhone(request.getPhone());
                user.setName(request.getName());
                user.setAvatar(request.getAvatar());
                user.setRole(UserRole.USER);
                user.setStatus(UserStatus.ACTIVE);
                logger.info("创建新用户: {}", user.getId());
            }
            
            user = userRepository.save(user);
            return convertToUserDto(user);
            
        } catch (Exception e) {
            logger.error("同步Supabase用户失败: {}", e.getMessage(), e);
            throw new RuntimeException("同步用户信息失败");
        }
    }
    
    /**
     * 验证JWT token并获取用户信息
     */
    public UserDto validateTokenAndGetUser(String token) {
        try {
            // 移除Bearer前缀
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            // 验证JWT token（这里简化处理，实际应该与Supabase的JWT验证逻辑对接）
            Claims claims = parseJwtToken(token);
            String userId = claims.getSubject();
            
            // 从数据库获取用户信息
            Optional<UserEntity> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("用户不存在");
            }
            
            UserEntity user = userOpt.get();
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new RuntimeException("用户状态异常");
            }
            
            return convertToUserDto(user);
            
        } catch (Exception e) {
            logger.error("验证token失败: {}", e.getMessage(), e);
            throw new RuntimeException("token验证失败");
        }
    }
    
    /**
     * 用户登出处理
     */
    public void logout(String userId) {
        try {
            // 这里可以添加登出相关的业务逻辑，比如清理缓存、记录登出日志等
            logger.info("用户登出: {}", userId);
            
            // 在实际应用中，可能需要调用Supabase的登出API
            // 或者将token加入黑名单等操作
            
        } catch (Exception e) {
            logger.error("用户登出失败: {}", e.getMessage(), e);
            throw new RuntimeException("登出失败");
        }
    }
    
    /**
     * 获取当前用户信息
     */
    public UserDto getCurrentUser(String userId) {
        try {
            Optional<UserEntity> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("用户不存在");
            }
            
            return convertToUserDto(userOpt.get());
            
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage(), e);
            throw new RuntimeException("获取用户信息失败");
        }
    }
    
    /**
     * 解析JWT token
     */
    private Claims parseJwtToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * 将UserEntity转换为UserDto
     */
    private UserDto convertToUserDto(UserEntity user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setName(user.getName());
        dto.setAvatar(user.getAvatar());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        
        // 转换企业信息
        if (user.getCompanyProfile() != null) {
            dto.setCompanyProfile(convertToCompanyProfileDto(user.getCompanyProfile()));
        }
        
        return dto;
    }
    
    /**
     * 将CompanyProfileEntity转换为CompanyProfileDto
     */
    private CompanyProfileDto convertToCompanyProfileDto(CompanyProfileEntity profile) {
        CompanyProfileDto dto = new CompanyProfileDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setRequirement(profile.getRequirement());
        dto.setCompanyName(profile.getCompanyName());
        dto.setLogoUrl(profile.getLogoUrl());
        dto.setStatus(profile.getStatus());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        
        // 设置地理位置信息
        if (profile.getCountry() != null) {
            dto.setCountryName(profile.getCountry().getName());
        }
        if (profile.getProvince() != null) {
            dto.setProvinceName(profile.getProvince().getName());
        }
        if (profile.getEconomicZone() != null) {
            dto.setEconomicZoneName(profile.getEconomicZone().getName());
        }
        
        return dto;
    }
}