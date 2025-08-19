package com.greentech.platform.dto;

import com.greentech.platform.entity.CodePurpose;
import com.greentech.platform.entity.VerificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 发送验证码请求DTO
 */
public class SendCodeRequest {
    
    @NotBlank(message = "标识符不能为空")
    private String identifier; // email or phone
    
    @NotNull(message = "验证码类型不能为空")
    private VerificationType type;
    
    @NotNull(message = "验证码用途不能为空")
    private CodePurpose purpose;
    
    private String countryCode = "+86"; // 默认中国区号
    
    // 默认构造函数
    public SendCodeRequest() {}
    
    // 构造函数
    public SendCodeRequest(String identifier, VerificationType type, CodePurpose purpose) {
        this.identifier = identifier;
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
    
    public String getCountryCode() {
        return countryCode;
    }
    
    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}