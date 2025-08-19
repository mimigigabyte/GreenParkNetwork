package com.greentech.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greentech.platform.config.SupabaseConfig;
import com.greentech.platform.dto.AuthResponse;
import com.greentech.platform.dto.UserDto;
import com.greentech.platform.entity.UserEntity;
import com.greentech.platform.entity.UserRole;
import com.greentech.platform.entity.UserStatus;
import com.greentech.platform.repository.UserRepository;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Supabase 认证服务
 */
@Service
@Transactional
public class SupabaseAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(SupabaseAuthService.class);
    private static final String AUTH_ENDPOINT = "/auth/v1";
    
    @Autowired
    private SupabaseConfig supabaseConfig;
    
    @Autowired
    private OkHttpClient httpClient;
    
    @Autowired
    private UserRepository userRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 发送邮箱验证码
     */
    public boolean sendEmailCode(String email, String purpose) {
        try {
            String endpoint = purpose.equals("register") ? "/signup" : "/otp";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            if (!purpose.equals("register")) {
                requestBody.put("type", "email");
            }
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + endpoint)
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    logger.info("邮箱验证码发送成功: email={}, purpose={}", email, purpose);
                    return true;
                } else {
                    logger.error("邮箱验证码发送失败: email={}, purpose={}, response={}", 
                            email, purpose, response.body().string());
                    return false;
                }
            }
        } catch (Exception e) {
            logger.error("发送邮箱验证码异常: email={}, purpose={}", email, purpose, e);
            return false;
        }
    }
    
    /**
     * 发送手机验证码
     */
    public boolean sendPhoneCode(String phone, String purpose) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("phone", phone);
            requestBody.put("type", "sms");
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + "/otp")
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    logger.info("手机验证码发送成功: phone={}, purpose={}", phone, purpose);
                    return true;
                } else {
                    logger.error("手机验证码发送失败: phone={}, purpose={}, response={}", 
                            phone, purpose, response.body().string());
                    return false;
                }
            }
        } catch (Exception e) {
            logger.error("发送手机验证码异常: phone={}, purpose={}", phone, purpose, e);
            return false;
        }
    }
    
    /**
     * 邮箱验证码注册
     */
    public AuthResponse registerWithEmail(String email, String emailCode, String password, String name) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            requestBody.put("token", emailCode);
            requestBody.put("type", "email");
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + "/verify")
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    JsonNode jsonResponse = objectMapper.readTree(responseBody);
                    
                    // 解析 Supabase 响应
                    String accessToken = jsonResponse.get("access_token").asText();
                    JsonNode userNode = jsonResponse.get("user");
                    String userId = userNode.get("id").asText();
                    
                    // 同步用户到本地数据库
                    UserEntity user = syncUserToDatabase(userId, email, null, name);
                    
                    // 构建响应
                    return buildAuthResponse(user, accessToken);
                } else {
                    logger.error("邮箱验证码注册失败: email={}, response={}", email, response.body().string());
                    return null;
                }
            }
        } catch (Exception e) {
            logger.error("邮箱验证码注册异常: email={}", email, e);
            return null;
        }
    }
    
    /**
     * 手机验证码注册
     */
    public AuthResponse registerWithPhone(String phone, String phoneCode, String password, String name) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("phone", phone);
            requestBody.put("token", phoneCode);
            requestBody.put("type", "sms");
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + "/verify")
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    JsonNode jsonResponse = objectMapper.readTree(responseBody);
                    
                    // 解析 Supabase 响应
                    String accessToken = jsonResponse.get("access_token").asText();
                    JsonNode userNode = jsonResponse.get("user");
                    String userId = userNode.get("id").asText();
                    
                    // 同步用户到本地数据库
                    UserEntity user = syncUserToDatabase(userId, null, phone, name);
                    
                    // 构建响应
                    return buildAuthResponse(user, accessToken);
                } else {
                    logger.error("手机验证码注册失败: phone={}, response={}", phone, response.body().string());
                    return null;
                }
            }
        } catch (Exception e) {
            logger.error("手机验证码注册异常: phone={}", phone, e);
            return null;
        }
    }
    
    /**
     * 手机验证码登录
     */
    public AuthResponse loginWithPhoneCode(String phone, String code) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("phone", phone);
            requestBody.put("token", code);
            requestBody.put("type", "sms");
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + "/verify")
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    JsonNode jsonResponse = objectMapper.readTree(responseBody);
                    
                    String accessToken = jsonResponse.get("access_token").asText();
                    JsonNode userNode = jsonResponse.get("user");
                    String userId = userNode.get("id").asText();
                    
                    // 获取或创建本地用户
                    Optional<UserEntity> userOpt = userRepository.findById(userId);
                    UserEntity user = userOpt.orElseGet(() -> 
                            syncUserToDatabase(userId, null, phone, null));
                    
                    return buildAuthResponse(user, accessToken);
                } else {
                    logger.error("手机验证码登录失败: phone={}, response={}", phone, response.body().string());
                    return null;
                }
            }
        } catch (Exception e) {
            logger.error("手机验证码登录异常: phone={}", phone, e);
            return null;
        }
    }
    
    /**
     * 验证码验证
     */
    public boolean verifyCode(String code, String phone, String email, String purpose) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("token", code);
            
            if (phone != null) {
                requestBody.put("phone", phone);
                requestBody.put("type", "sms");
            } else if (email != null) {
                requestBody.put("email", email);
                requestBody.put("type", "email");
            }
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            RequestBody body = RequestBody.create(
                    jsonBody, MediaType.get("application/json; charset=utf-8"));
            
            Request request = new Request.Builder()
                    .url(supabaseConfig.getUrl() + AUTH_ENDPOINT + "/verify")
                    .post(body)
                    .addHeader("apikey", supabaseConfig.getAnonKey())
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            logger.error("验证码验证异常: phone={}, email={}, purpose={}", phone, email, purpose, e);
            return false;
        }
    }
    
    /**
     * 同步用户到本地数据库
     */
    private UserEntity syncUserToDatabase(String supabaseUserId, String email, String phone, String name) {
        Optional<UserEntity> existingUser = userRepository.findById(supabaseUserId);
        
        UserEntity user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (email != null) user.setEmail(email);
            if (phone != null) user.setPhone(phone);
            if (name != null) user.setName(name);
            user.setUpdatedAt(LocalDateTime.now());
        } else {
            user = new UserEntity();
            user.setId(supabaseUserId);
            user.setEmail(email);
            user.setPhone(phone);
            user.setName(name != null ? name : (email != null ? email.split("@")[0] : "用户" + System.currentTimeMillis()));
            user.setRole(UserRole.USER);
            user.setStatus(UserStatus.ACTIVE);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
        }
        
        return userRepository.save(user);
    }
    
    /**
     * 构建认证响应
     */
    private AuthResponse buildAuthResponse(UserEntity user, String accessToken) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setEmail(user.getEmail());
        userDto.setPhone(user.getPhone());
        userDto.setName(user.getName());
        userDto.setAvatar(user.getAvatar());
        userDto.setRole(user.getRole());
        userDto.setStatus(user.getStatus());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setUpdatedAt(user.getUpdatedAt());
        
        AuthResponse response = new AuthResponse();
        response.setUser(userDto);
        response.setAccessToken(accessToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(3600); // 1小时
        
        return response;
    }
}