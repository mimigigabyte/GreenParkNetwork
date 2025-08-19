package com.greentech.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 华为云RDS连接测试
 * 
 * 使用方法：
 * 1. 设置环境变量或使用 @TestPropertySource 指定华为云RDS连接信息
 * 2. 运行测试验证连接是否正常
 */
@SpringBootTest
@ActiveProfiles("huaweicloud")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:mysql://your-rds-instance.huaweicloud.com:3306/your_database_name",
    "spring.datasource.username=root",
    "spring.datasource.password=your-database-password",
    "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver"
})
public class HuaweiCloudRdsConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testHuaweiCloudRdsConnection() {
        assertNotNull(dataSource, "数据源应该被正确注入");
        
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "数据库连接应该成功建立");
            assertFalse(connection.isClosed(), "连接应该是开启状态");
            
            // 测试基本查询
            var resultSet = connection.createStatement().executeQuery("SELECT 1 as test");
            assertTrue(resultSet.next(), "应该能够执行基本查询");
            assertEquals(1, resultSet.getInt("test"), "查询结果应该为1");
            
            System.out.println("✅ 华为云RDS连接测试成功！");
            System.out.println("数据库URL: " + connection.getMetaData().getURL());
            System.out.println("数据库产品: " + connection.getMetaData().getDatabaseProductName());
            System.out.println("数据库版本: " + connection.getMetaData().getDatabaseProductVersion());
            
        } catch (SQLException e) {
            fail("数据库连接失败: " + e.getMessage());
        }
    }

    @Test
    void testConnectionPoolConfiguration() {
        assertNotNull(dataSource, "数据源应该被正确注入");
        
        if (dataSource instanceof com.zaxxer.hikari.HikariDataSource) {
            com.zaxxer.hikari.HikariDataSource hikariDataSource = (com.zaxxer.hikari.HikariDataSource) dataSource;
            
            System.out.println("连接池配置信息:");
            System.out.println("最大连接数: " + hikariDataSource.getMaximumPoolSize());
            System.out.println("最小空闲连接: " + hikariDataSource.getMinimumIdle());
            System.out.println("连接超时: " + hikariDataSource.getConnectionTimeout());
            System.out.println("空闲超时: " + hikariDataSource.getIdleTimeout());
            System.out.println("最大生命周期: " + hikariDataSource.getMaxLifetime());
            
            assertTrue(hikariDataSource.getMaximumPoolSize() > 0, "最大连接数应该大于0");
            assertTrue(hikariDataSource.getMinimumIdle() >= 0, "最小空闲连接应该大于等于0");
        }
    }
} 