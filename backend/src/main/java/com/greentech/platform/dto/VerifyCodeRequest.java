package com.greentech.platform.dto;

import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.entity.VerificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * 验证验证码请求DTO
 */
public class VerifyCodeRequest {
    
    @NotBlank(message = "标识符不能为空")
    private String identifier; // email or phone
    
    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^\\d{6}$", message = "验证码必须是6位数字")
    private String code;
    
    @NotNull(message = "验证码类型不能为空")
    private VerificationType type;
    
    @NotNull(message = "验证码用途不能为空")
    private CodePurpose purpose;
    
    // 默认构造函数
    public VerifyCodeRequest() {}
    
    // 构造函数
    public VerifyCodeRequest(String identifier, String code, VerificationType type, CodePurpose purpose) {
        this.identifier = identifier;
        this.code = code;
        this.type = type;
        this.purpose = purpose;
    }
    
    // Getters and Setters
    public String getIdentifier() {
        return identifier;
    }
    
    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public VerificationType getType() {
        return type;
    }
    
    public void setType(VerificationType type) {
        this.type = type;
    }
    
    public CodePurpose getPurpose() {
        return purpose;
    }
    
    public void setPurpose(CodePurpose purpose) {
        this.purpose = purpose;
    }
}