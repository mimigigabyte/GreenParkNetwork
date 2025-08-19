package com.greentech.platform.entity;

/**
 * 企业需求类型枚举
 */
public enum RequirementType {
    PUBLISH_TECHNOLOGY("发布我的绿色低碳技术"),
    FIND_TECHNOLOGY("寻找特定绿色低碳技术"),
    INDUSTRY_INSIGHTS("了解业界前沿动态");
    
    private final String description;
    
    RequirementType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 根据描述获取枚举值
     */
    public static RequirementType fromDescription(String description) {
        for (RequirementType type : RequirementType.values()) {
            if (type.getDescription().equals(description)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown requirement type: " + description);
    }
}