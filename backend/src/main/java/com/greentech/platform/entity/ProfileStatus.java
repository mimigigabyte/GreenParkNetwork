package com.greentech.platform.entity;

/**
 * 企业信息状态枚举
 */
public enum ProfileStatus {
    PENDING_REVIEW("待审核"),
    APPROVED("已审核"),
    REJECTED("已拒绝"),
    INCOMPLETE("信息不完整");
    
    private final String description;
    
    ProfileStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}