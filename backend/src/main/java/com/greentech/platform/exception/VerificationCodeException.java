package com.greentech.platform.exception;

/**
 * 验证码异常
 */
public class VerificationCodeException extends RuntimeException {
    
    private String errorCode;
    
    public VerificationCodeException(String message) {
        super(message);
    }
    
    public VerificationCodeException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public VerificationCodeException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public VerificationCodeException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
}