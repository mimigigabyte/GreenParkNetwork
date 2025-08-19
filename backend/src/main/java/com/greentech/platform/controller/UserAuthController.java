package com.greentech.platform.controller;

import com.greentech.platform.common.ApiResponse;
import com.greentech.platform.dto.*;
import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.service.UserAuthService;
import com.greentech.platform.service.VerificationCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "用户认证", description = "用户登录、注册、验证码相关接口")
public class UserAuthController {
    
    @Autowired
    private UserAuthService userAuthService;
    
    @Autowired
    private VerificationCodeService verificationCodeService;
    
    // ============ 登录相关接口 ============
    
    @PostMapping("/login/password")
    @Operation(summary = "密码登录", description = "支持邮箱或手机号+密码登录")
    public ApiResponse<AuthResponse> passwordLogin(@Valid @RequestBody PasswordLoginRequest request) {
        try {
            AuthResponse response = userAuthService.passwordLogin(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/login/phone-code")
    @Operation(summary = "手机验证码登录", description = "使用手机号和验证码登录")
    public ApiResponse<AuthResponse> phoneCodeLogin(@Valid @RequestBody PhoneCodeLoginRequest request) {
        try {
            AuthResponse response = userAuthService.phoneCodeLogin(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    // ============ 注册相关接口 ============
    
    @PostMapping("/register/email")
    @Operation(summary = "邮箱注册", description = "使用邮箱和验证码注册新用户")
    public ApiResponse<AuthResponse> emailRegister(@Valid @RequestBody EmailRegisterRequest request) {
        try {
            AuthResponse response = userAuthService.emailRegister(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/register/phone")
    @Operation(summary = "手机注册", description = "使用手机号和验证码注册新用户")
    public ApiResponse<AuthResponse> phoneRegister(@Valid @RequestBody PhoneRegisterRequest request) {
        try {
            AuthResponse response = userAuthService.phoneRegister(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    // ============ 验证码相关接口 ============
    
    @PostMapping("/code/email")
    @Operation(summary = "发送邮箱验证码", description = "向指定邮箱发送验证码")
    public ApiResponse<Map<String, Object>> sendEmailCode(@Valid @RequestBody SendEmailCodeRequest request) {
        try {
            CodePurpose purpose = CodePurpose.valueOf(request.getPurpose().toUpperCase());
            verificationCodeService.sendEmailVerificationCode(request.getEmail(), purpose);
            
            return ApiResponse.success(Map.of(
                "success", true,
                "message", "验证码已发送至您的邮箱",
                "expiresIn", 300
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/code/phone")
    @Operation(summary = "发送手机验证码", description = "向指定手机号发送验证码")
    public ApiResponse<Map<String, Object>> sendPhoneCode(@Valid @RequestBody SendPhoneCodeRequest request) {
        try {
            CodePurpose purpose = CodePurpose.valueOf(request.getPurpose().toUpperCase());
            verificationCodeService.sendPhoneVerificationCode(
                request.getPhone(), 
                request.getCountryCode(), 
                purpose
            );
            
            return ApiResponse.success(Map.of(
                "success", true,
                "message", "验证码已发送至您的手机",
                "expiresIn", 300
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/code/verify")
    @Operation(summary = "验证验证码", description = "验证邮箱或手机验证码是否正确")
    public ApiResponse<Map<String, Object>> verifyCode(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            String email = request.get("email");
            String phone = request.get("phone");
            String purpose = request.get("purpose");
            
            if (code == null || purpose == null) {
                return ApiResponse.error("验证码和用途不能为空");
            }
            
            String identifier = email != null ? email : phone;
            if (identifier == null) {
                return ApiResponse.error("请提供邮箱或手机号");
            }
            
            CodePurpose codePurpose = CodePurpose.valueOf(purpose.toUpperCase());
            boolean isValid = verificationCodeService.verifyCode(identifier, code, codePurpose);
            
            return ApiResponse.success(Map.of(
                "valid", isValid,
                "message", isValid ? "验证码验证成功" : "验证码验证失败"
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    // ============ 密码重置接口 ============
    
    @PostMapping("/password/reset/email")
    @Operation(summary = "通过邮箱重置密码", description = "使用邮箱验证码重置密码")
    public ApiResponse<Map<String, Object>> resetPasswordByEmail(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            if (request.getEmail() == null) {
                return ApiResponse.error("邮箱不能为空");
            }
            userAuthService.resetPassword(request);
            return ApiResponse.success(Map.of(
                "success", true,
                "message", "密码重置成功"
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/password/reset/phone")
    @Operation(summary = "通过手机重置密码", description = "使用手机验证码重置密码")
    public ApiResponse<Map<String, Object>> resetPasswordByPhone(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            if (request.getPhone() == null) {
                return ApiResponse.error("手机号不能为空");
            }
            userAuthService.resetPassword(request);
            return ApiResponse.success(Map.of(
                "success", true,
                "message", "密码重置成功"
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    // ============ 用户管理接口 ============
    
    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    public ApiResponse<UserDto> getCurrentUser(Authentication authentication) {
        try {
            String userId = authentication.getName();
            UserDto user = userAuthService.getCurrentUser(userId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/logout")
    @Operation(summary = "用户登出", description = "用户登出（实际上只需要前端清除token）")
    public ApiResponse<String> logout() {
        // JWT是无状态的，登出只需要前端清除token
        return ApiResponse.success("登出成功");
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "刷新Token", description = "使用refresh token获取新的access token")
    public ApiResponse<Map<String, String>> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null) {
                return ApiResponse.error("刷新token不能为空");
            }
            
            AuthResponse response = userAuthService.refreshToken(refreshToken);
            return ApiResponse.success(Map.of(
                "token", response.getToken(),
                "refreshToken", response.getRefreshToken()
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping("/check-account")
    @Operation(summary = "检查账号是否存在", description = "检查邮箱或手机号是否已注册")
    public ApiResponse<Map<String, Object>> checkAccount(@RequestBody Map<String, String> request) {
        try {
            String account = request.get("account");
            String type = request.get("type");
            
            if (account == null || type == null) {
                return ApiResponse.error("账号和类型不能为空");
            }
            
            boolean exists = userAuthService.checkAccountExists(account, type);
            return ApiResponse.success(Map.of(
                "exists", exists,
                "verified", exists // 简化处理，假设存在即已验证
            ));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}