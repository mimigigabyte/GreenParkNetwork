package com.greentech.platform.controller;

import com.greentech.platform.common.ApiResponse;
import com.greentech.platform.dto.*;
import com.greentech.platform.service.SupabaseAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Supabase 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Supabase 认证", description = "基于 Supabase 的用户认证接口")
public class SupabaseAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(SupabaseAuthController.class);
    
    @Autowired
    private SupabaseAuthService supabaseAuthService;
    
    /**
     * 发送手机验证码
     */
    @PostMapping("/code/phone")
    @Operation(summary = "发送手机验证码", description = "使用 Supabase 发送手机验证码")
    public ResponseEntity<ApiResponse<Object>> sendPhoneCode(
            @Valid @RequestBody SendPhoneCodeRequest request) {
        
        try {
            logger.info("发送手机验证码: phone={}, purpose={}", request.getPhone(), request.getPurpose());
            
            boolean success = supabaseAuthService.sendPhoneCode(
                    request.getPhone(), 
                    request.getPurpose()
            );
            
            if (success) {
                return ResponseEntity.ok(ApiResponse.success("手机验证码发送成功"));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("手机验证码发送失败"));
            }
            
        } catch (Exception e) {
            logger.error("发送手机验证码失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
    
    /**
     * 发送邮箱验证码
     */
    @PostMapping("/code/email")
    @Operation(summary = "发送邮箱验证码", description = "使用 Supabase 发送邮箱验证码")
    public ResponseEntity<ApiResponse<Object>> sendEmailCode(
            @Valid @RequestBody SendEmailCodeRequest request) {
        
        try {
            logger.info("发送邮箱验证码: email={}, purpose={}", request.getEmail(), request.getPurpose());
            
            boolean success = supabaseAuthService.sendEmailCode(
                    request.getEmail(), 
                    request.getPurpose()
            );
            
            if (success) {
                return ResponseEntity.ok(ApiResponse.success("邮箱验证码发送成功"));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("邮箱验证码发送失败"));
            }
            
        } catch (Exception e) {
            logger.error("发送邮箱验证码失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
    
    /**
     * 验证码验证
     */
    @PostMapping("/code/verify")
    @Operation(summary = "验证验证码", description = "验证手机或邮箱验证码")
    public ResponseEntity<ApiResponse<Object>> verifyCode(
            @Valid @RequestBody SupabaseVerifyCodeRequest request) {
        
        try {
            logger.info("验证验证码: phone={}, email={}, purpose={}", 
                    request.getPhone(), request.getEmail(), request.getPurpose());
            
            boolean isValid = supabaseAuthService.verifyCode(
                    request.getCode(),
                    request.getPhone(),
                    request.getEmail(),
                    request.getPurpose()
            );
            
            if (isValid) {
                return ResponseEntity.ok(ApiResponse.success("验证码验证成功"));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("验证码错误或已过期"));
            }
            
        } catch (Exception e) {
            logger.error("验证码验证失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
    
    /**
     * 手机验证码登录
     */
    @PostMapping("/login/phone-code")
    @Operation(summary = "手机验证码登录", description = "使用手机验证码登录")
    public ResponseEntity<ApiResponse<AuthResponse>> phoneCodeLogin(
            @Valid @RequestBody PhoneCodeLoginRequest request) {
        
        try {
            logger.info("手机验证码登录: phone={}", request.getPhone());
            
            AuthResponse response = supabaseAuthService.loginWithPhoneCode(
                    request.getPhone(),
                    request.getCode()
            );
            
            if (response != null) {
                return ResponseEntity.ok(ApiResponse.success("登录成功", response));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("登录失败，请检查验证码"));
            }
            
        } catch (Exception e) {
            logger.error("手机验证码登录失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
    
    /**
     * 邮箱验证码注册
     */
    @PostMapping("/register/email")
    @Operation(summary = "邮箱验证码注册", description = "使用邮箱验证码注册新用户")
    public ResponseEntity<ApiResponse<AuthResponse>> emailRegister(
            @Valid @RequestBody EmailRegisterRequest request) {
        
        try {
            logger.info("邮箱注册: email={}", request.getEmail());
            
            AuthResponse response = supabaseAuthService.registerWithEmail(
                    request.getEmail(),
                    request.getEmailCode(),
                    request.getPassword(),
                    request.getName()
            );
            
            if (response != null) {
                return ResponseEntity.ok(ApiResponse.success("注册成功", response));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("注册失败，请检查验证码"));
            }
            
        } catch (Exception e) {
            logger.error("邮箱注册失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
    
    /**
     * 手机验证码注册
     */
    @PostMapping("/register/phone")
    @Operation(summary = "手机验证码注册", description = "使用手机验证码注册新用户")
    public ResponseEntity<ApiResponse<AuthResponse>> phoneRegister(
            @Valid @RequestBody PhoneRegisterRequest request) {
        
        try {
            logger.info("手机注册: phone={}", request.getPhone());
            
            AuthResponse response = supabaseAuthService.registerWithPhone(
                    request.getPhone(),
                    request.getPhoneCode(),
                    request.getPassword(),
                    request.getName()
            );
            
            if (response != null) {
                return ResponseEntity.ok(ApiResponse.success("注册成功", response));
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("注册失败，请检查验证码"));
            }
            
        } catch (Exception e) {
            logger.error("手机注册失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统异常，请稍后重试"));
        }
    }
}