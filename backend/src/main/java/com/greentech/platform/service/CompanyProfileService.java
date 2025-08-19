package com.greentech.platform.service;

import com.greentech.platform.dto.CompanyProfileDto;
import com.greentech.platform.dto.CompanyProfileRequest;
import com.greentech.platform.dto.UpdateProfileRequest;
import com.greentech.platform.entity.*;
import com.greentech.platform.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

/**
 * 企业信息服务类
 */
@Service
@Transactional
public class CompanyProfileService {
    
    private static final Logger logger = LoggerFactory.getLogger(CompanyProfileService.class);
    
    @Autowired
    private CompanyProfileRepository companyProfileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CountryRepository countryRepository;
    
    @Autowired
    private ProvinceRepository provinceRepository;
    
    @Autowired
    private EconomicZoneRepository economicZoneRepository;
    
    /**
     * 提交企业信息
     */
    public CompanyProfileDto submitProfile(String userId, CompanyProfileRequest request) {
        try {
            // 检查用户是否存在
            Optional<UserEntity> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("用户不存在");
            }
            UserEntity user = userOpt.get();
            
            // 检查是否已有企业信息
            if (companyProfileRepository.existsByUserId(userId)) {
                throw new RuntimeException("企业信息已存在，请使用更新接口");
            }
            
            // 创建企业信息
            CompanyProfileEntity profile = new CompanyProfileEntity();
            profile.setUser(user);
            
            // 设置需求类型
            try {
                RequirementType requirement = RequirementType.fromDescription(request.getRequirement());
                profile.setRequirement(requirement);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("无效的需求类型: " + request.getRequirement());
            }
            
            profile.setCompanyName(request.getCompanyName());
            
            // 设置国家信息
            CountryEntity country = getOrCreateCountry(request.getCountry());
            profile.setCountry(country);
            
            // 设置省份信息（如果提供）
            if (request.getProvince() != null && !request.getProvince().trim().isEmpty()) {
                ProvinceEntity province = getOrCreateProvince(request.getProvince(), country);
                profile.setProvince(province);
                
                // 设置经济开发区信息（如果提供）
                if (request.getEconomicZone() != null && !request.getEconomicZone().trim().isEmpty()) {
                    EconomicZoneEntity economicZone = getOrCreateEconomicZone(request.getEconomicZone(), province);
                    profile.setEconomicZone(economicZone);
                }
            }
            
            profile.setStatus(ProfileStatus.PENDING_REVIEW);
            
            // 保存企业信息
            profile = companyProfileRepository.save(profile);
            
            logger.info("企业信息提交成功: userId={}, companyName={}", userId, request.getCompanyName());
            
            return convertToDto(profile);
            
        } catch (Exception e) {
            logger.error("提交企业信息失败: {}", e.getMessage(), e);
            throw new RuntimeException("提交企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 上传企业Logo
     */
    public String uploadCompanyLogo(String userId, MultipartFile logoFile) {
        try {
            // 检查用户是否有企业信息
            Optional<CompanyProfileEntity> profileOpt = companyProfileRepository.findByUserId(userId);
            if (profileOpt.isEmpty()) {
                throw new RuntimeException("企业信息不存在");
            }
            
            // 验证文件
            if (logoFile.isEmpty()) {
                throw new RuntimeException("文件不能为空");
            }
            
            // 检查文件类型
            String contentType = logoFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("只能上传图片文件");
            }
            
            // 检查文件大小（5MB）
            if (logoFile.getSize() > 5 * 1024 * 1024) {
                throw new RuntimeException("文件大小不能超过5MB");
            }
            
            // 这里应该实现实际的文件上传逻辑，比如上传到云存储
            // 现在模拟返回一个URL
            String logoUrl = "https://example.com/logos/" + System.currentTimeMillis() + "_" + logoFile.getOriginalFilename();
            
            // 更新企业信息中的Logo URL
            CompanyProfileEntity profile = profileOpt.get();
            profile.setLogoUrl(logoUrl);
            companyProfileRepository.save(profile);
            
            logger.info("企业Logo上传成功: userId={}, logoUrl={}", userId, logoUrl);
            
            return logoUrl;
            
        } catch (Exception e) {
            logger.error("上传企业Logo失败: {}", e.getMessage(), e);
            throw new RuntimeException("上传企业Logo失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取企业信息
     */
    public CompanyProfileDto getProfile(String userId) {
        try {
            Optional<CompanyProfileEntity> profileOpt = companyProfileRepository.findByUserId(userId);
            if (profileOpt.isEmpty()) {
                throw new RuntimeException("企业信息不存在");
            }
            
            return convertToDto(profileOpt.get());
            
        } catch (Exception e) {
            logger.error("获取企业信息失败: {}", e.getMessage(), e);
            throw new RuntimeException("获取企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新企业信息
     */
    public CompanyProfileDto updateProfile(String userId, UpdateProfileRequest request) {
        try {
            Optional<CompanyProfileEntity> profileOpt = companyProfileRepository.findByUserId(userId);
            if (profileOpt.isEmpty()) {
                throw new RuntimeException("企业信息不存在");
            }
            
            CompanyProfileEntity profile = profileOpt.get();
            
            // 更新需求类型
            if (request.getRequirement() != null && !request.getRequirement().trim().isEmpty()) {
                try {
                    RequirementType requirement = RequirementType.fromDescription(request.getRequirement());
                    profile.setRequirement(requirement);
                } catch (IllegalArgumentException e) {
                    throw new RuntimeException("无效的需求类型: " + request.getRequirement());
                }
            }
            
            // 更新企业名称
            if (request.getCompanyName() != null && !request.getCompanyName().trim().isEmpty()) {
                profile.setCompanyName(request.getCompanyName());
            }
            
            // 更新地理位置信息
            if (request.getCountry() != null && !request.getCountry().trim().isEmpty()) {
                CountryEntity country = getOrCreateCountry(request.getCountry());
                profile.setCountry(country);
                
                // 如果国家变了，清空省份和经济开发区
                if (!country.equals(profile.getCountry())) {
                    profile.setProvince(null);
                    profile.setEconomicZone(null);
                }
            }
            
            // 更新省份
            if (request.getProvince() != null && !request.getProvince().trim().isEmpty() && profile.getCountry() != null) {
                ProvinceEntity province = getOrCreateProvince(request.getProvince(), profile.getCountry());
                profile.setProvince(province);
                
                // 如果省份变了，清空经济开发区
                if (!province.equals(profile.getProvince())) {
                    profile.setEconomicZone(null);
                }
            }
            
            // 更新经济开发区
            if (request.getEconomicZone() != null && !request.getEconomicZone().trim().isEmpty() && profile.getProvince() != null) {
                EconomicZoneEntity economicZone = getOrCreateEconomicZone(request.getEconomicZone(), profile.getProvince());
                profile.setEconomicZone(economicZone);
            }
            
            // 保存更新
            profile = companyProfileRepository.save(profile);
            
            logger.info("企业信息更新成功: userId={}", userId);
            
            return convertToDto(profile);
            
        } catch (Exception e) {
            logger.error("更新企业信息失败: {}", e.getMessage(), e);
            throw new RuntimeException("更新企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取或创建国家
     */
    private CountryEntity getOrCreateCountry(String countryName) {
        Optional<CountryEntity> countryOpt = countryRepository.findByName(countryName);
        if (countryOpt.isPresent()) {
            return countryOpt.get();
        }
        
        // 创建新国家
        CountryEntity country = new CountryEntity();
        country.setName(countryName);
        country.setCode(countryName.equals("中国") ? "CN" : countryName.substring(0, 2).toUpperCase());
        return countryRepository.save(country);
    }
    
    /**
     * 获取或创建省份
     */
    private ProvinceEntity getOrCreateProvince(String provinceName, CountryEntity country) {
        Optional<ProvinceEntity> provinceOpt = provinceRepository.findByName(provinceName);
        if (provinceOpt.isPresent()) {
            return provinceOpt.get();
        }
        
        // 创建新省份
        ProvinceEntity province = new ProvinceEntity();
        province.setName(provinceName);
        province.setCode(provinceName.substring(0, Math.min(2, provinceName.length())).toUpperCase());
        province.setCountry(country);
        return provinceRepository.save(province);
    }
    
    /**
     * 获取或创建经济开发区
     */
    private EconomicZoneEntity getOrCreateEconomicZone(String zoneName, ProvinceEntity province) {
        Optional<EconomicZoneEntity> zoneOpt = economicZoneRepository.findByName(zoneName);
        if (zoneOpt.isPresent()) {
            return zoneOpt.get();
        }
        
        // 创建新经济开发区
        EconomicZoneEntity zone = new EconomicZoneEntity();
        zone.setName(zoneName);
        zone.setCode("EZ" + System.currentTimeMillis() % 10000);
        zone.setProvince(province);
        return economicZoneRepository.save(zone);
    }
    
    /**
     * 将实体转换为DTO
     */
    private CompanyProfileDto convertToDto(CompanyProfileEntity profile) {
        CompanyProfileDto dto = new CompanyProfileDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setRequirement(profile.getRequirement());
        dto.setCompanyName(profile.getCompanyName());
        dto.setLogoUrl(profile.getLogoUrl());
        dto.setStatus(profile.getStatus());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        
        // 设置地理位置信息
        if (profile.getCountry() != null) {
            dto.setCountryName(profile.getCountry().getName());
        }
        if (profile.getProvince() != null) {
            dto.setProvinceName(profile.getProvince().getName());
        }
        if (profile.getEconomicZone() != null) {
            dto.setEconomicZoneName(profile.getEconomicZone().getName());
        }
        
        return dto;
    }
}