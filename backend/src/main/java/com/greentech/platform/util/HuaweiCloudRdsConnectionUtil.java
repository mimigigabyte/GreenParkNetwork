package com.greentech.platform.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

/**
 * 华为云RDS连接工具类
 * 
 * 提供数据库连接测试和监控功能
 */
@Component
public class HuaweiCloudRdsConnectionUtil {

    private static final Logger logger = LoggerFactory.getLogger(HuaweiCloudRdsConnectionUtil.class);

    @Autowired
    private DataSource dataSource;

    /**
     * 测试数据库连接
     * 
     * @return 连接测试结果
     */
    public ConnectionTestResult testConnection() {
        ConnectionTestResult result = new ConnectionTestResult();
        
        try (Connection connection = dataSource.getConnection()) {
            // 基本连接测试
            result.setConnected(true);
            
            // 获取数据库信息
            DatabaseMetaData metaData = connection.getMetaData();
            result.setDatabaseProductName(metaData.getDatabaseProductName());
            result.setDatabaseVersion(metaData.getDatabaseProductVersion());
            result.setUrl(metaData.getURL());
            
            // 测试基本查询
            var resultSet = connection.createStatement().executeQuery("SELECT 1 as test");
            if (resultSet.next() && resultSet.getInt("test") == 1) {
                result.setQueryTestPassed(true);
            }
            
            logger.info("✅ 华为云RDS连接测试成功");
            logger.info("数据库产品: {}", result.getDatabaseProductName());
            logger.info("数据库版本: {}", result.getDatabaseVersion());
            logger.info("连接URL: {}", result.getUrl());
            
        } catch (SQLException e) {
            result.setConnected(false);
            result.setErrorMessage(e.getMessage());
            logger.error("❌ 华为云RDS连接测试失败: {}", e.getMessage());
        }
        
        return result;
    }

    /**
     * 获取连接池状态信息
     * 
     * @return 连接池状态
     */
    public ConnectionPoolStatus getConnectionPoolStatus() {
        ConnectionPoolStatus status = new ConnectionPoolStatus();
        
        if (dataSource instanceof com.zaxxer.hikari.HikariDataSource) {
            com.zaxxer.hikari.HikariDataSource hikariDataSource = (com.zaxxer.hikari.HikariDataSource) dataSource;
            
            status.setPoolName(hikariDataSource.getPoolName());
            status.setMaximumPoolSize(hikariDataSource.getMaximumPoolSize());
            status.setMinimumIdle(hikariDataSource.getMinimumIdle());
            status.setConnectionTimeout(hikariDataSource.getConnectionTimeout());
            status.setIdleTimeout(hikariDataSource.getIdleTimeout());
            status.setMaxLifetime(hikariDataSource.getMaxLifetime());
            
            // 获取运行时状态
            var poolMXBean = hikariDataSource.getHikariPoolMXBean();
            if (poolMXBean != null) {
                status.setActiveConnections(poolMXBean.getActiveConnections());
                status.setIdleConnections(poolMXBean.getIdleConnections());
                status.setTotalConnections(poolMXBean.getTotalConnections());
            }
        }
        
        return status;
    }

    /**
     * 连接测试结果类
     */
    public static class ConnectionTestResult {
        private boolean connected;
        private boolean queryTestPassed;
        private String databaseProductName;
        private String databaseVersion;
        private String url;
        private String errorMessage;

        // Getters and Setters
        public boolean isConnected() { return connected; }
        public void setConnected(boolean connected) { this.connected = connected; }
        
        public boolean isQueryTestPassed() { return queryTestPassed; }
        public void setQueryTestPassed(boolean queryTestPassed) { this.queryTestPassed = queryTestPassed; }
        
        public String getDatabaseProductName() { return databaseProductName; }
        public void setDatabaseProductName(String databaseProductName) { this.databaseProductName = databaseProductName; }
        
        public String getDatabaseVersion() { return databaseVersion; }
        public void setDatabaseVersion(String databaseVersion) { this.databaseVersion = databaseVersion; }
        
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    /**
     * 连接池状态类
     */
    public static class ConnectionPoolStatus {
        private String poolName;
        private int maximumPoolSize;
        private int minimumIdle;
        private long connectionTimeout;
        private long idleTimeout;
        private long maxLifetime;
        private int activeConnections;
        private int idleConnections;
        private int totalConnections;

        // Getters and Setters
        public String getPoolName() { return poolName; }
        public void setPoolName(String poolName) { this.poolName = poolName; }
        
        public int getMaximumPoolSize() { return maximumPoolSize; }
        public void setMaximumPoolSize(int maximumPoolSize) { this.maximumPoolSize = maximumPoolSize; }
        
        public int getMinimumIdle() { return minimumIdle; }
        public void setMinimumIdle(int minimumIdle) { this.minimumIdle = minimumIdle; }
        
        public long getConnectionTimeout() { return connectionTimeout; }
        public void setConnectionTimeout(long connectionTimeout) { this.connectionTimeout = connectionTimeout; }
        
        public long getIdleTimeout() { return idleTimeout; }
        public void setIdleTimeout(long idleTimeout) { this.idleTimeout = idleTimeout; }
        
        public long getMaxLifetime() { return maxLifetime; }
        public void setMaxLifetime(long maxLifetime) { this.maxLifetime = maxLifetime; }
        
        public int getActiveConnections() { return activeConnections; }
        public void setActiveConnections(int activeConnections) { this.activeConnections = activeConnections; }
        
        public int getIdleConnections() { return idleConnections; }
        public void setIdleConnections(int idleConnections) { this.idleConnections = idleConnections; }
        
        public int getTotalConnections() { return totalConnections; }
        public void setTotalConnections(int totalConnections) { this.totalConnections = totalConnections; }
    }
} 