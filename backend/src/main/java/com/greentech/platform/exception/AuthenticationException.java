package com.greentech.platform.exception;

/**
 * 认证异常
 */
public class AuthenticationException extends RuntimeException {
    
    private String errorCode;
    
    public AuthenticationException(String message) {
        super(message);
    }
    
    public AuthenticationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public AuthenticationException(String message, String errorCode, Throwable cause) {
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