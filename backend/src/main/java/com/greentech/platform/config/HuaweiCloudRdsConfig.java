package com.greentech.platform.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * 华为云RDS配置类
 * 
 * 提供华为云RDS MySQL数据库的连接配置
 * 包含连接池优化配置和监控配置
 */
@Configuration
@Profile("huaweicloud")
public class HuaweiCloudRdsConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.driver-class-name}")
    private String driverClassName;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int maximumPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:5}")
    private int minimumIdle;

    @Value("${spring.datasource.hikari.connection-timeout:20000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.idle-timeout:300000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.max-lifetime:1200000}")
    private long maxLifetime;

    @Value("${spring.datasource.hikari.leak-detection-threshold:60000}")
    private long leakDetectionThreshold;

    @Value("${spring.datasource.hikari.validation-timeout:5000}")
    private long validationTimeout;

    /**
     * 配置华为云RDS数据源
     * 
     * @return 配置好的数据源
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.profiles.active", havingValue = "huaweicloud")
    public DataSource huaweiCloudRdsDataSource() {
        HikariConfig config = new HikariConfig();
        
        // 基本连接配置
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        
        // 连接池配置
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        
        // 华为云RDS优化配置
        config.setLeakDetectionThreshold(leakDetectionThreshold);
        config.setValidationTimeout(validationTimeout);
        config.setConnectionTestQuery("SELECT 1");
        
        // 连接池名称（用于监控）
        config.setPoolName("HuaweiCloudRdsHikariCP");
        
        // 连接池监控配置
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");
        config.addDataSourceProperty("useLocalSessionState", "true");
        config.addDataSourceProperty("rewriteBatchedStatements", "true");
        config.addDataSourceProperty("cacheResultSetMetadata", "true");
        config.addDataSourceProperty("cacheServerConfiguration", "true");
        config.addDataSourceProperty("elideSetAutoCommits", "true");
        config.addDataSourceProperty("maintainTimeStats", "false");
        
        // 华为云RDS特定配置
        config.addDataSourceProperty("useSSL", "true");
        config.addDataSourceProperty("requireSSL", "false");
        config.addDataSourceProperty("verifyServerCertificate", "false");
        config.addDataSourceProperty("useUnicode", "true");
        config.addDataSourceProperty("characterEncoding", "utf8");
        config.addDataSourceProperty("serverTimezone", "Asia/Shanghai");
        
        return new HikariDataSource(config);
    }
} 