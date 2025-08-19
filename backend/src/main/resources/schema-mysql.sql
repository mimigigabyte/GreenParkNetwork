-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS greentech_platform 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE greentech_platform;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户ID（UUID）',
    email VARCHAR(255) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    name VARCHAR(100) NOT NULL COMMENT '用户名',
    avatar VARCHAR(500) COMMENT '头像URL',
    role ENUM('USER', 'ADMIN') DEFAULT 'USER' COMMENT '用户角色',
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE' COMMENT '用户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    identifier VARCHAR(255) NOT NULL COMMENT '标识符（邮箱或手机号）',
    type ENUM('EMAIL', 'PHONE', 'SMS') NOT NULL COMMENT '验证码类型',
    code VARCHAR(10) NOT NULL COMMENT '验证码',
    purpose ENUM('REGISTER', 'LOGIN', 'FORGOT_PASSWORD', 'RESET_PASSWORD', 'CHANGE_EMAIL', 'CHANGE_PHONE') NOT NULL COMMENT '用途',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_identifier_type_purpose (identifier, type, purpose),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='验证码表';

-- 国家表
CREATE TABLE IF NOT EXISTS countries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '国家名称',
    code VARCHAR(10) NOT NULL UNIQUE COMMENT '国家代码',
    phone_code VARCHAR(10) COMMENT '电话国际代码',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='国家表';

-- 省份表
CREATE TABLE IF NOT EXISTS provinces (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    country_id BIGINT NOT NULL COMMENT '国家ID',
    name VARCHAR(100) NOT NULL COMMENT '省份名称',
    code VARCHAR(20) COMMENT '省份代码',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    INDEX idx_country_id (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='省份表';

-- 经济开发区表
CREATE TABLE IF NOT EXISTS economic_zones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    province_id BIGINT NOT NULL COMMENT '省份ID',
    name VARCHAR(200) NOT NULL COMMENT '开发区名称',
    code VARCHAR(50) COMMENT '开发区代码',
    type VARCHAR(50) COMMENT '开发区类型',
    level VARCHAR(50) COMMENT '开发区级别',
    description TEXT COMMENT '开发区描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
    INDEX idx_province_id (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经济开发区表';

-- 公司档案表
CREATE TABLE IF NOT EXISTS company_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    company_name VARCHAR(200) NOT NULL COMMENT '公司名称',
    legal_representative VARCHAR(100) COMMENT '法定代表人',
    business_license VARCHAR(100) UNIQUE COMMENT '营业执照号',
    company_type VARCHAR(50) COMMENT '公司类型',
    industry VARCHAR(100) COMMENT '所属行业',
    registration_capital DECIMAL(15,2) COMMENT '注册资本',
    establishment_date DATE COMMENT '成立日期',
    
    -- 联系信息
    contact_person VARCHAR(100) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(255) COMMENT '联系邮箱',
    
    -- 地址信息
    country_id BIGINT COMMENT '国家ID',
    province_id BIGINT COMMENT '省份ID',
    economic_zone_id BIGINT COMMENT '经济开发区ID',
    detailed_address TEXT COMMENT '详细地址',
    
    -- 业务信息
    business_scope TEXT COMMENT '经营范围',
    main_products TEXT COMMENT '主营产品',
    annual_revenue DECIMAL(15,2) COMMENT '年营业额',
    employee_count INT COMMENT '员工数量',
    
    -- 认证信息
    certifications JSON COMMENT '资质认证信息',
    
    -- 状态信息
    status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT' COMMENT '档案状态',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
    FOREIGN KEY (economic_zone_id) REFERENCES economic_zones(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_company_name (company_name),
    INDEX idx_business_license (business_license),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公司档案表';