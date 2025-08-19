package com.greentech.platform.service;

import com.greentech.platform.config.EmailConfig;
import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.entity.VerificationCodeEntity;
import com.greentech.platform.entity.VerificationType;
import com.greentech.platform.repository.VerificationCodeRepository;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * 验证码服务类
 */
@Service
@Transactional
public class VerificationCodeService {
    
    private static final Logger logger = LoggerFactory.getLogger(VerificationCodeService.class);
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRY_MINUTES = 5; // 5分钟有效期
    private static final int MAX_ATTEMPTS_PER_HOUR = 5; // 每小时最多5次
    
    @Autowired
    private VerificationCodeRepository verificationCodeRepository;
    
    @Autowired(required = false)
    private Resend resendClient;
    
    @Autowired
    private EmailConfig emailConfig;
    
    /**
     * 发送邮箱验证码
     */
    public void sendEmailVerificationCode(String email, CodePurpose purpose) {
        try {
            // 检查发送频率
            checkSendingFrequency(email, VerificationType.EMAIL, purpose);
            
            // 生成验证码
            String code = generateVerificationCode();
            
            // 保存验证码到数据库
            saveVerificationCode(email, VerificationType.EMAIL, code, purpose);
            
            // 发送邮件
            sendEmail(email, code, purpose);
            
            logger.info("邮箱验证码发送成功: {}", email);
            
        } catch (Exception e) {
            logger.error("发送邮箱验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("发送邮箱验证码失败: " + e.getMessage());
        }
    }
    
    /**
     * 发送手机验证码
     */
    public void sendSmsVerificationCode(String phone, String countryCode, CodePurpose purpose) {
        try {
            String identifier = countryCode != null ? countryCode + phone : "+86" + phone;
            
            // 检查发送频率
            checkSendingFrequency(identifier, VerificationType.PHONE, purpose);
            
            // 生成验证码
            String code = generateVerificationCode();
            
            // 保存验证码到数据库
            saveVerificationCode(identifier, VerificationType.PHONE, code, purpose);
            
            // 发送短信（这里暂时模拟，实际应该集成短信服务商）
            sendSms(identifier, code, purpose);
            
            logger.info("短信验证码发送成功: {}", identifier);
            
        } catch (Exception e) {
            logger.error("发送短信验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("发送短信验证码失败: " + e.getMessage());
        }
    }
    
    /**
     * 发送手机验证码（简化版本，使用手机号作为标识符）
     */
    public void sendPhoneVerificationCode(String phone, String countryCode, CodePurpose purpose) {
        try {
            // 检查发送频率
            checkSendingFrequency(phone, VerificationType.PHONE, purpose);
            
            // 生成验证码
            String code = generateVerificationCode();
            
            // 保存验证码到数据库
            saveVerificationCode(phone, VerificationType.PHONE, code, purpose);
            
            // 发送短信（这里暂时模拟，实际应该集成短信服务商）
            sendSms(phone, code, purpose);
            
            logger.info("手机验证码发送成功: {}", phone);
            
        } catch (Exception e) {
            logger.error("发送手机验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("发送手机验证码失败: " + e.getMessage());
        }
    }
    
    /**
     * 验证验证码
     */
    public boolean verifyCode(String identifier, String code, CodePurpose purpose) {
        try {
            // 确定验证码类型
            VerificationType type = identifier.contains("@") ? VerificationType.EMAIL : VerificationType.PHONE;
            
            return verifyCode(identifier, code, type, purpose);
            
        } catch (Exception e) {
            logger.error("验证验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("验证验证码失败");
        }
    }
    
    /**
     * 验证验证码（指定类型）
     */
    public boolean verifyCode(String identifier, String code, VerificationType type, CodePurpose purpose) {
        try {
            // 查找有效的验证码
            Optional<VerificationCodeEntity> validCode = verificationCodeRepository
                    .findLatestValidCode(identifier, type, purpose, LocalDateTime.now());
            
            if (validCode.isEmpty()) {
                logger.warn("验证码不存在或已过期: {}", identifier);
                throw new RuntimeException("验证码不存在或已过期");
            }
            
            VerificationCodeEntity codeEntity = validCode.get();
            if (!codeEntity.getCode().equals(code)) {
                logger.warn("验证码不正确: {}", identifier);
                throw new RuntimeException("验证码不正确");
            }
            
            // 标记为已使用
            verificationCodeRepository.markAsUsed(codeEntity.getId());
            logger.info("验证码验证成功: {}", identifier);
            return true;
            
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("验证验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("验证验证码失败");
        }
    }
    
    /**
     * 清理过期验证码
     */
    @Scheduled(fixedRate = 300000) // 5分钟执行一次
    public void cleanupExpiredCodes() {
        try {
            verificationCodeRepository.deleteExpiredCodes(LocalDateTime.now());
            logger.debug("清理过期验证码完成");
        } catch (Exception e) {
            logger.error("清理过期验证码失败: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 生成验证码
     */
    private String generateVerificationCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
    
    /**
     * 保存验证码到数据库
     */
    private void saveVerificationCode(String identifier, VerificationType type, String code, CodePurpose purpose) {
        // 创建新的验证码记录
        VerificationCodeEntity codeEntity = new VerificationCodeEntity(
                identifier,
                type,
                code,
                purpose,
                LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES)
        );
        
        verificationCodeRepository.save(codeEntity);
    }
    
    /**
     * 检查发送频率
     */
    private void checkSendingFrequency(String identifier, VerificationType type, CodePurpose purpose) {
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
        
        // 检查1分钟内是否已发送验证码
        boolean hasRecentCode = verificationCodeRepository.existsRecentCode(
                identifier, type, purpose, oneMinuteAgo);
        
        if (hasRecentCode) {
            throw new RuntimeException("发送验证码过于频繁，请稍后再试");
        }
    }
    
    /**
     * 发送邮件
     */
    private void sendEmail(String email, String code, CodePurpose purpose) {
        try {
            String subject = getEmailSubject(purpose);
            String content = getEmailContent(code, purpose);
            
            // 如果没有配置邮件服务，使用日志模拟
            if (resendClient == null || emailConfig.getApiKey() == null || emailConfig.getFromEmail() == null) {
                logger.info("未配置邮件服务，模拟发送邮件到 {} : 主题={}, 验证码={}", email, subject, code);
                return;
            }
            
            // 使用 Resend 邮件服务发送邮件
            CreateEmailOptions emailOptions = CreateEmailOptions.builder()
                    .from(emailConfig.getFromEmail())
                    .to(email)
                    .subject(subject)
                    .html(content)
                    .build();
            
            CreateEmailResponse response = resendClient.emails().send(emailOptions);
            logger.info("邮件发送成功到 {} : 邮件ID={}, 验证码={}", email, response.getId(), code);
            
        } catch (ResendException e) {
            logger.error("Resend邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败: " + e.getMessage());
        } catch (Exception e) {
            logger.error("邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败");
        }
    }
    
    /**
     * 发送短信（模拟实现）
     */
    private void sendSms(String phone, String code, CodePurpose purpose) {
        // 这里应该集成实际的短信服务商API
        // 比如阿里云SMS、腾讯云SMS等
        logger.info("模拟发送短信到 {} : 验证码 {}", phone, code);
    }
    
    /**
     * 获取邮件主题
     */
    private String getEmailSubject(CodePurpose purpose) {
        return switch (purpose) {
            case REGISTER -> "绿色技术平台 - 注册验证码";
            case LOGIN -> "绿色技术平台 - 登录验证码";
            case FORGOT_PASSWORD, RESET_PASSWORD -> "绿色技术平台 - 重置密码验证码";
            case CHANGE_EMAIL -> "绿色技术平台 - 更换邮箱验证码";
            case CHANGE_PHONE -> "绿色技术平台 - 更换手机号验证码";
        };
    }
    
    /**
     * 获取邮件内容
     */
    private String getEmailContent(String code, CodePurpose purpose) {
        String purposeText = switch (purpose) {
            case REGISTER -> "注册";
            case LOGIN -> "登录";
            case FORGOT_PASSWORD, RESET_PASSWORD -> "重置密码";
            case CHANGE_EMAIL -> "更换邮箱";
            case CHANGE_PHONE -> "更换手机号";
        };
        
        String actionUrl = getActionUrl(purpose);
        
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>绿色技术平台 - 验证码</title>
                </head>
                <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: 'Microsoft YaHei', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="padding: 40px 30px;">
                            <!-- Logo和标题 -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #00b899; font-size: 28px; margin: 0; font-weight: bold;">绿色技术平台</h1>
                                <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">Green Technology Platform</p>
                            </div>
                            
                            <!-- 验证码内容 -->
                            <div style="margin-bottom: 40px;">
                                <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">您的%s验证码</h2>
                                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                                    您好！您正在进行%s操作，请使用以下验证码完成验证：
                                </p>
                                
                                <!-- 验证码框 -->
                                <div style="background: linear-gradient(135deg, #00b899 0%%, #009a7a 100%%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                                    <div style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">%s</div>
                                    <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 10px;">请复制此验证码到注册页面</div>
                                </div>
                                
                                <!-- 快捷链接 -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="%s" style="display: inline-block; background-color: #00b899; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">点击此处快速验证</a>
                                </div>
                                
                                <!-- 重要提示 -->
                                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
                                    <p style="margin: 0; color: #856404; font-size: 14px;">
                                        <strong>重要提示：</strong><br>
                                        • 验证码有效期为 <strong>5分钟</strong>，请尽快使用<br>
                                        • 请勿将验证码告知他人，以保护账户安全<br>
                                        • 如果这不是您的操作，请忽略此邮件
                                    </p>
                                </div>
                            </div>
                            
                            <!-- 底部信息 -->
                            <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                                <p style="color: #999; font-size: 12px; margin: 0;">
                                    此邮件由绿色技术平台系统自动发送，请勿回复<br>
                                    如有疑问，请联系我们的客服团队
                                </p>
                                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                                    © 2024 绿色技术平台 版权所有
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """, purposeText, purposeText, code, actionUrl);
    }
    
    /**
     * 获取操作链接URL
     */
    private String getActionUrl(CodePurpose purpose) {
        String frontendUrl = System.getProperty("app.frontend-url", "http://localhost:3000");
        return switch (purpose) {
            case REGISTER -> frontendUrl + "/?action=register";
            case LOGIN -> frontendUrl + "/?action=login";
            case FORGOT_PASSWORD, RESET_PASSWORD -> frontendUrl + "/?action=reset-password";
            default -> frontendUrl;
        };
    }
}