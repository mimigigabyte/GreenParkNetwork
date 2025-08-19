package com.greentech.platform.controller;

import com.greentech.platform.util.HuaweiCloudRdsConnectionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 华为云RDS控制器
 * 
 * 提供数据库连接测试和监控的REST API
 */
@RestController
@RequestMapping("/api/huaweicloud/rds")
@CrossOrigin(origins = "*")
public class HuaweiCloudRdsController {

    @Autowired
    private HuaweiCloudRdsConnectionUtil connectionUtil;

    /**
     * 测试数据库连接
     * 
     * @return 连接测试结果
     */
    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var result = connectionUtil.testConnection();
            
            response.put("success", result.isConnected());
            response.put("queryTestPassed", result.isQueryTestPassed());
            response.put("databaseProductName", result.getDatabaseProductName());
            response.put("databaseVersion", result.getDatabaseVersion());
            response.put("url", result.getUrl());
            
            if (!result.isConnected()) {
                response.put("errorMessage", result.getErrorMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("errorMessage", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取连接池状态
     * 
     * @return 连接池状态信息
     */
    @GetMapping("/pool-status")
    public ResponseEntity<Map<String, Object>> getPoolStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var status = connectionUtil.getConnectionPoolStatus();
            
            response.put("poolName", status.getPoolName());
            response.put("maximumPoolSize", status.getMaximumPoolSize());
            response.put("minimumIdle", status.getMinimumIdle());
            response.put("connectionTimeout", status.getConnectionTimeout());
            response.put("idleTimeout", status.getIdleTimeout());
            response.put("maxLifetime", status.getMaxLifetime());
            response.put("activeConnections", status.getActiveConnections());
            response.put("idleConnections", status.getIdleConnections());
            response.put("totalConnections", status.getTotalConnections());
            
            // 计算使用率
            if (status.getMaximumPoolSize() > 0) {
                double usageRate = (double) status.getActiveConnections() / status.getMaximumPoolSize() * 100;
                response.put("usageRate", String.format("%.2f%%", usageRate));
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取完整的数据库状态信息
     * 
     * @return 完整的数据库状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getFullStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 测试连接
            var connectionResult = connectionUtil.testConnection();
            response.put("connection", connectionResult);
            
            // 获取连接池状态
            var poolStatus = connectionUtil.getConnectionPoolStatus();
            response.put("pool", poolStatus);
            
            // 添加时间戳
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 健康检查端点
     * 
     * @return 健康状态
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var result = connectionUtil.testConnection();
            
            if (result.isConnected() && result.isQueryTestPassed()) {
                response.put("status", "UP");
                response.put("message", "华为云RDS连接正常");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "DOWN");
                response.put("message", "华为云RDS连接异常");
                response.put("error", result.getErrorMessage());
                return ResponseEntity.status(503).body(response);
            }
            
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("message", "华为云RDS健康检查失败");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
} 