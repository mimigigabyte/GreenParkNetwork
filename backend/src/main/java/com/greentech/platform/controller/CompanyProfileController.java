package com.greentech.platform.controller;

import com.greentech.platform.common.ApiResponse;
import com.greentech.platform.dto.CompanyProfileDto;
import com.greentech.platform.dto.CompanyProfileRequest;
import com.greentech.platform.dto.UpdateProfileRequest;
import com.greentech.platform.dto.UserDto;
import com.greentech.platform.service.AuthService;
import com.greentech.platform.service.CompanyProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 企业信息控制器
 */
@RestController
@RequestMapping("/api/company")
@Tag(name = "企业信息管理", description = "企业信息相关接口")
public class CompanyProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(CompanyProfileController.class);
    
    @Autowired
    private CompanyProfileService companyProfileService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * 提交企业信息
     */
    @PostMapping("/profile")
    @Operation(summary = "提交企业信息", description = "提交或创建企业信息档案")
    public ApiResponse<CompanyProfileDto> submitProfile(
            @RequestParam("requirement") String requirement,
            @RequestParam("companyName") String companyName,
            @RequestParam("country") String country,
            @RequestParam(value = "province", required = false) String province,
            @RequestParam(value = "economicZone", required = false) String economicZone,
            @RequestParam(value = "logo", required = false) MultipartFile logo,
            HttpServletRequest request) {
        try {
            // 获取当前用户
            String token = extractTokenFromRequest(request);
            UserDto currentUser = authService.validateTokenAndGetUser(token);
            
            // 构建请求对象
            CompanyProfileRequest profileRequest = new CompanyProfileRequest();
            profileRequest.setRequirement(requirement);
            profileRequest.setCompanyName(companyName);
            profileRequest.setCountry(country);
            profileRequest.setProvince(province);
            profileRequest.setEconomicZone(economicZone);
            
            // 提交企业信息
            CompanyProfileDto profile = companyProfileService.submitProfile(currentUser.getId(), profileRequest);
            
            // 如果有Logo文件，上传Logo
            if (logo != null && !logo.isEmpty()) {
                try {
                    String logoUrl = companyProfileService.uploadCompanyLogo(currentUser.getId(), logo);
                    profile.setLogoUrl(logoUrl);
                } catch (Exception e) {
                    logger.warn("上传Logo失败，但企业信息已保存: {}", e.getMessage());
                }
            }
            
            return ApiResponse.success("企业信息提交成功", profile);
            
        } catch (Exception e) {
            logger.error("提交企业信息失败: {}", e.getMessage(), e);
            return ApiResponse.error("提交企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取企业信息
     */
    @GetMapping("/profile")
    @Operation(summary = "获取企业信息", description = "获取当前用户的企业信息")
    public ApiResponse<CompanyProfileDto> getProfile(HttpServletRequest request) {
        try {
            // 获取当前用户
            String token = extractTokenFromRequest(request);
            UserDto currentUser = authService.validateTokenAndGetUser(token);
            
            // 获取企业信息
            CompanyProfileDto profile = companyProfileService.getProfile(currentUser.getId());
            
            return ApiResponse.success("获取企业信息成功", profile);
            
        } catch (Exception e) {
            logger.error("获取企业信息失败: {}", e.getMessage(), e);
            return ApiResponse.error("获取企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新企业信息
     */
    @PutMapping("/profile")
    @Operation(summary = "更新企业信息", description = "更新企业信息档案")
    public ApiResponse<CompanyProfileDto> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {
        try {
            // 获取当前用户
            String token = extractTokenFromRequest(httpRequest);
            UserDto currentUser = authService.validateTokenAndGetUser(token);
            
            // 更新企业信息
            CompanyProfileDto profile = companyProfileService.updateProfile(currentUser.getId(), request);
            
            return ApiResponse.success("企业信息更新成功", profile);
            
        } catch (Exception e) {
            logger.error("更新企业信息失败: {}", e.getMessage(), e);
            return ApiResponse.error("更新企业信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 上传企业Logo
     */
    @PostMapping("/profile/logo")
    @Operation(summary = "上传企业Logo", description = "上传或更新企业Logo")
    public ApiResponse<String> uploadLogo(
            @RequestParam("logo") MultipartFile logo,
            HttpServletRequest request) {
        try {
            // 获取当前用户
            String token = extractTokenFromRequest(request);
            UserDto currentUser = authService.validateTokenAndGetUser(token);
            
            // 上传Logo
            String logoUrl = companyProfileService.uploadCompanyLogo(currentUser.getId(), logo);
            
            return ApiResponse.success("Logo上传成功", logoUrl);
            
        } catch (Exception e) {
            logger.error("上传Logo失败: {}", e.getMessage(), e);
            return ApiResponse.error("上传Logo失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取国家列表
     */
    @GetMapping("/countries")
    @Operation(summary = "获取国家列表", description = "获取支持的国家列表")
    public ApiResponse<String[]> getCountries() {
        try {
            // 这里返回一个固定的国家列表，实际应该从数据库获取
            String[] countries = {
                "中国", "美国", "日本", "德国", "英国", "法国", "加拿大", "澳大利亚", 
                "韩国", "新加坡", "印度", "巴西", "俄罗斯", "意大利", "西班牙"
            };
            
            return ApiResponse.success("获取国家列表成功", countries);
            
        } catch (Exception e) {
            logger.error("获取国家列表失败: {}", e.getMessage(), e);
            return ApiResponse.error("获取国家列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取省份列表
     */
    @GetMapping("/provinces")
    @Operation(summary = "获取省份列表", description = "根据国家获取省份列表")
    public ApiResponse<String[]> getProvinces(@RequestParam("country") String country) {
        try {
            if ("中国".equals(country)) {
                String[] provinces = {
                    "北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省",
                    "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省",
                    "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省",
                    "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区"
                };
                return ApiResponse.success("获取省份列表成功", provinces);
            } else {
                return ApiResponse.success("获取省份列表成功", new String[0]);
            }
            
        } catch (Exception e) {
            logger.error("获取省份列表失败: {}", e.getMessage(), e);
            return ApiResponse.error("获取省份列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取经济开发区列表
     */
    @GetMapping("/economic-zones")
    @Operation(summary = "获取经开区列表", description = "根据省份获取经济开发区列表")
    public ApiResponse<String[]> getEconomicZones(@RequestParam("province") String province) {
        try {
            // 这里返回一个示例列表，实际应该从数据库或配置文件获取
            String[] zones;
            switch (province) {
                case "江苏省":
                    zones = new String[]{"苏州工业园区", "南京经济技术开发区", "无锡经济开发区", "常州经济开发区"};
                    break;
                case "广东省":
                    zones = new String[]{"深圳经济特区", "广州经济技术开发区", "东莞经济技术开发区", "佛山经济开发区"};
                    break;
                case "浙江省":
                    zones = new String[]{"杭州经济技术开发区", "宁波经济技术开发区", "温州经济技术开发区", "嘉兴经济开发区"};
                    break;
                default:
                    zones = new String[0];
            }
            
            return ApiResponse.success("获取经开区列表成功", zones);
            
        } catch (Exception e) {
            logger.error("获取经开区列表失败: {}", e.getMessage(), e);
            return ApiResponse.error("获取经开区列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 从请求中提取token
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("未提供有效的认证token");
        }
        return authHeader;
    }
}