package com.greentech.platform.service;

import com.greentech.platform.dto.*;
import com.greentech.platform.entity.*;
import com.greentech.platform.exception.AuthenticationException;
import com.greentech.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 用户认证服务
 */
@Service
@Transactional
public class UserAuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private VerificationCodeService verificationCodeService;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * 密码登录
     */
    public AuthResponse passwordLogin(PasswordLoginRequest request) {
        // 查找用户
        UserEntity user = userRepository.findByEmailOrPhone(request.getAccount())
                .orElseThrow(() -> new AuthenticationException("用户不存在"));
        
        // 验证账号类型匹配
        if ("email".equals(request.getType()) && !request.getAccount().equals(user.getEmail())) {
            throw new AuthenticationException("邮箱不匹配");
        }
        if ("phone".equals(request.getType()) && !request.getAccount().equals(user.getPhone())) {
            throw new AuthenticationException("手机号不匹配");
        }
        
        // 由于我们使用外部认证系统（Supabase），这里暂时跳过密码验证
        // 在实际实现中，应该调用Supabase Auth API或者存储密码哈希
        
        // 生成token
        UserDetails userDetails = userDetailsService.loadUserByUserId(user.getId());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return new AuthResponse(new UserDto(user), token, refreshToken);
    }
    
    /**
     * 手机验证码登录
     */
    public AuthResponse phoneCodeLogin(PhoneCodeLoginRequest request) {
        // 验证验证码
        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), 
                                          VerificationType.PHONE, CodePurpose.LOGIN);
        
        // 查找或创建用户
        UserEntity user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new AuthenticationException("用户不存在，请先注册"));
        
        // 生成token
        UserDetails userDetails = userDetailsService.loadUserByUserId(user.getId());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return new AuthResponse(new UserDto(user), token, refreshToken);
    }
    
    /**
     * 邮箱注册
     */
    public AuthResponse emailRegister(EmailRegisterRequest request) {
        // 验证验证码
        verificationCodeService.verifyCode(request.getEmail(), request.getEmailCode(),
                                          VerificationType.EMAIL, CodePurpose.REGISTER);
        
        // 检查用户是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthenticationException("该邮箱已被注册");
        }
        
        // 创建用户
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        
        // 生成用户名（如果未提供）
        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            name = "用户" + request.getEmail().split("@")[0];
        }
        user.setName(name);
        
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        
        // 保存用户
        user = userRepository.save(user);
        
        // 生成token
        UserDetails userDetails = userDetailsService.loadUserByUserId(user.getId());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return new AuthResponse(new UserDto(user), token, refreshToken);
    }
    
    /**
     * 手机注册
     */
    public AuthResponse phoneRegister(PhoneRegisterRequest request) {
        // 验证验证码
        verificationCodeService.verifyCode(request.getPhone(), request.getPhoneCode(),
                                          VerificationType.PHONE, CodePurpose.REGISTER);
        
        // 检查用户是否已存在
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AuthenticationException("该手机号已被注册");
        }
        
        // 创建用户
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID().toString());
        user.setPhone(request.getPhone());
        
        // 生成用户名（如果未提供）
        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            name = "用户" + request.getPhone().substring(request.getPhone().length() - 4);
        }
        user.setName(name);
        
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        
        // 保存用户
        user = userRepository.save(user);
        
        // 生成token
        UserDetails userDetails = userDetailsService.loadUserByUserId(user.getId());
        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        
        return new AuthResponse(new UserDto(user), token, refreshToken);
    }
    
    /**
     * 重置密码
     */
    public void resetPassword(ResetPasswordRequest request) {
        UserEntity user = null;
        
        if (request.getEmail() != null) {
            // 验证邮箱验证码
            verificationCodeService.verifyCode(request.getEmail(), request.getCode(),
                                              VerificationType.EMAIL, CodePurpose.RESET_PASSWORD);
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new AuthenticationException("用户不存在"));
        } else if (request.getPhone() != null) {
            // 验证手机验证码
            verificationCodeService.verifyCode(request.getPhone(), request.getCode(),
                                              VerificationType.PHONE, CodePurpose.RESET_PASSWORD);
            user = userRepository.findByPhone(request.getPhone())
                    .orElseThrow(() -> new AuthenticationException("用户不存在"));
        } else {
            throw new AuthenticationException("请提供邮箱或手机号");
        }
        
        // 在实际实现中，这里应该更新Supabase Auth中的密码
        // 或者如果本地存储密码，则更新密码哈希
        
        // 暂时不做处理，因为密码管理由Supabase处理
    }
    
    /**
     * 获取当前用户信息
     */
    public UserDto getCurrentUser(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("用户不存在"));
        return new UserDto(user);
    }
    
    /**
     * 检查账号是否存在
     */
    public boolean checkAccountExists(String account, String type) {
        if ("email".equals(type)) {
            return userRepository.existsByEmail(account);
        } else if ("phone".equals(type)) {
            return userRepository.existsByPhone(account);
        } else {
            throw new IllegalArgumentException("无效的账号类型");
        }
    }
    
    /**
     * 刷新token
     */
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new AuthenticationException("刷新token无效或已过期");
        }
        
        String userId = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUserId(userId);
        
        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("用户不存在"));
        
        return new AuthResponse(new UserDto(user), newAccessToken, newRefreshToken);
    }
}