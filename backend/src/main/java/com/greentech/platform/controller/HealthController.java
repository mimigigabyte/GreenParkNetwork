package com.greentech.platform.controller;

import com.greentech.platform.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 *
 * @author GreenTech Platform Team
 */
@RestController
@RequestMapping("/health")
@Tag(name = "健康检查", description = "系统健康状态检查接口")
public class HealthController {

    @GetMapping
    @Operation(summary = "健康检查", description = "检查系统运行状态")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("timestamp", LocalDateTime.now());
        healthData.put("service", "绿色技术平台后端服务");
        healthData.put("version", "1.0.0");
        
        return ApiResponse.success("系统运行正常", healthData);
    }

    @GetMapping("/ping")
    @Operation(summary = "ping检查", description = "简单的连通性检查")
    public ApiResponse<String> ping() {
        return ApiResponse.success("pong");
    }
}