package com.greentech.platform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * 数据库连接测试
 * 仅在mysql profile下运行
 */
@Component
@Profile("mysql")
public class DatabaseConnectionTest implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionTest.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("开始测试华为云RDS MySQL数据库连接...");
        
        try (Connection connection = dataSource.getConnection()) {
            logger.info("✅ 数据库连接成功！");
            
            // 获取数据库信息
            DatabaseMetaData metaData = connection.getMetaData();
            logger.info("数据库产品名称: {}", metaData.getDatabaseProductName());
            logger.info("数据库版本: {}", metaData.getDatabaseProductVersion());
            logger.info("数据库URL: {}", metaData.getURL());
            logger.info("用户名: {}", metaData.getUserName());
            
            // 测试查询
            try (var statement = connection.createStatement();
                 var resultSet = statement.executeQuery("SELECT VERSION()")) {
                if (resultSet.next()) {
                    String version = resultSet.getString(1);
                    logger.info("MySQL版本: {}", version);
                }
            }
            
            // 检查数据库中的表
            logger.info("检查数据库中的表:");
            try (var statement = connection.createStatement();
                 var resultSet = statement.executeQuery("SHOW TABLES")) {
                boolean hasTables = false;
                while (resultSet.next()) {
                    hasTables = true;
                    String tableName = resultSet.getString(1);
                    logger.info("  - {}", tableName);
                }
                if (!hasTables) {
                    logger.info("  数据库中没有表");
                }
            }
            
            logger.info("✅ 数据库连接测试完成！");
            
        } catch (SQLException e) {
            logger.error("❌ 数据库连接失败: {}", e.getMessage(), e);
            throw new RuntimeException("数据库连接测试失败", e);
        }
    }
} 