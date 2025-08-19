import java.sql.*;

public class TestDbConnection {
    public static void main(String[] args) {
        String url = "jdbc:mysql://121.36.17.209:14000/rds-carbon_new?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true";
        String username = "root";
        String password = "hx9jgnmK6u_k*Qjo";
        
        System.out.println("开始测试华为云RDS MySQL数据库连接...");
        System.out.println("连接URL: " + url);
        System.out.println("用户名: " + username);
        
        try {
            // 加载MySQL驱动
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("✅ MySQL驱动加载成功");
            
            // 建立连接
            Connection connection = DriverManager.getConnection(url, username, password);
            System.out.println("✅ 数据库连接成功！");
            
            // 获取数据库信息
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("数据库产品名称: " + metaData.getDatabaseProductName());
            System.out.println("数据库版本: " + metaData.getDatabaseProductVersion());
            System.out.println("数据库URL: " + metaData.getURL());
            System.out.println("用户名: " + metaData.getUserName());
            
            // 测试查询
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT VERSION()");
            if (resultSet.next()) {
                String version = resultSet.getString(1);
                System.out.println("MySQL版本: " + version);
            }
            resultSet.close();
            
            // 检查数据库中的表
            System.out.println("检查数据库中的表:");
            ResultSet tablesResult = statement.executeQuery("SHOW TABLES");
            boolean hasTables = false;
            while (tablesResult.next()) {
                hasTables = true;
                String tableName = tablesResult.getString(1);
                System.out.println("  - " + tableName);
            }
            if (!hasTables) {
                System.out.println("  数据库中没有表");
            }
            tablesResult.close();
            statement.close();
            
            // 关闭连接
            connection.close();
            System.out.println("✅ 数据库连接测试完成！");
            
        } catch (ClassNotFoundException e) {
            System.err.println("❌ MySQL驱动未找到: " + e.getMessage());
            System.err.println("请确保MySQL JDBC驱动在classpath中");
        } catch (SQLException e) {
            System.err.println("❌ 数据库连接失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 