package com.greentech.platform.controller;

import com.greentech.platform.common.ApiResponse;
import com.greentech.platform.dto.*;
import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.entity.VerificationType;
import com.greentech.platform.service.AuthService;
import com.greentech.platform.service.VerificationCodeService;
import com.greentech.platform.service.SupabaseAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "认证管理", description = "用户认证相关接口")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private SupabaseAuthService supabaseAuthService;
    
    @Autowired
    private VerificationCodeService verificationCodeService;
    
    /**
     * 同步Supabase用户到本地数据库
     */
    @PostMapping("/sync-user")
    @Operation(summary = "同步用户", description = "将Supabase用户信息同步到本地数据库")
    public ApiResponse<UserDto> syncUser(@Valid @RequestBody SyncUserRequest request) {
        try {
            UserDto user = authService.syncSupabaseUser(request);
            return ApiResponse.success("用户信息同步成功", user);
        } catch (Exception e) {
            logger.error("同步用户失败: {}", e.getMessage(), e);
            return ApiResponse.error("同步用户失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取当前用户信息（旧版本，已废弃，使用UserAuthController中的getCurrentUser）
     */
    @GetMapping("/me-legacy")
    @Operation(summary = "获取当前用户（旧版本）", description = "获取当前登录用户的详细信息（已废弃）")
    public ApiResponse<UserDto> getCurrentUserLegacy(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            UserDto user = authService.validateTokenAndGetUser(token);
            return ApiResponse.success("获取用户信息成功", user);
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage(), e);
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户登出（旧版本，已废弃，使用UserAuthController中的logout）
     */
    @PostMapping("/logout-legacy")
    @Operation(summary = "用户登出（旧版本）", description = "用户退出登录（已废弃）")
    public ApiResponse<Void> logoutLegacy(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            UserDto user = authService.validateTokenAndGetUser(token);
            authService.logout(user.getId());
            return ApiResponse.success("登出成功");
        } catch (Exception e) {
            logger.error("用户登出失败: {}", e.getMessage(), e);
            return ApiResponse.error("登出失败: " + e.getMessage());
        }
    }
    
    /**
     * 发送验证码
     */
    @PostMapping("/send-verification-code")
    @Operation(summary = "发送验证码", description = "发送邮箱或短信验证码")
    public ApiResponse<Void> sendVerificationCode(@Valid @RequestBody SendCodeRequest request) {
        try {
            if (request.getType() == VerificationType.EMAIL) {
                verificationCodeService.sendEmailVerificationCode(request.getIdentifier(), request.getPurpose());
            } else if (request.getType() == VerificationType.SMS) {
                verificationCodeService.sendSmsVerificationCode(
                        request.getIdentifier(), 
                        request.getCountryCode(), 
                        request.getPurpose()
                );
            } else {
                return ApiResponse.error("不支持的验证码类型");
            }
            
            return ApiResponse.success("验证码发送成功");
        } catch (Exception e) {
            logger.error("发送验证码失败: {}", e.getMessage(), e);
            return ApiResponse.error("发送验证码失败: " + e.getMessage());
        }
    }
    
    /**
     * 验证验证码
     */
    @PostMapping("/verify-code")
    @Operation(summary = "验证验证码", description = "验证邮箱或短信验证码")
    public ApiResponse<Void> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            boolean isValid = verificationCodeService.verifyCode(
                    request.getIdentifier(),
                    request.getCode(),
                    request.getPurpose()
            );
            
            if (isValid) {
                return ApiResponse.success("验证码验证成功");
            } else {
                return ApiResponse.error("验证码不正确或已过期");
            }
        } catch (Exception e) {
            logger.error("验证码验证失败: {}", e.getMessage(), e);
            return ApiResponse.error("验证码验证失败: " + e.getMessage());
        }
    }
    
    /**
     * 从请求中提取token
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("未提供有效的认证token");
        }
        return authHeader;
    }
}