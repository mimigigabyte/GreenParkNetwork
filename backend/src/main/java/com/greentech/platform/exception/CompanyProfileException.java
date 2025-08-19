package com.greentech.platform.exception;

/**
 * 企业信息异常
 */
public class CompanyProfileException extends RuntimeException {
    
    private String errorCode;
    
    public CompanyProfileException(String message) {
        super(message);
    }
    
    public CompanyProfileException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public CompanyProfileException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public CompanyProfileException(String message, String errorCode, Throwable cause) {
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