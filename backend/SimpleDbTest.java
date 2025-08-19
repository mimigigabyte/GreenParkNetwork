import java.sql.*;

public class SimpleDbTest {
    public static void main(String[] args) {
        System.out.println("=== 华为云RDS MySQL数据库连接测试 ===");
        
        // 数据库连接信息
        String url = "jdbc:mysql://121.36.17.209:14000/rds-carbon_new?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true";
        String username = "root";
        String password = "hx9jgnmK6u_k*Qjo";
        
        System.out.println("连接URL: " + url);
        System.out.println("用户名: " + username);
        System.out.println();
        
        try {
            // 尝试建立连接
            System.out.println("正在尝试连接数据库...");
            Connection conn = DriverManager.getConnection(url, username, password);
            System.out.println("✅ 数据库连接成功！");
            
            // 获取数据库信息
            DatabaseMetaData metaData = conn.getMetaData();
            System.out.println("数据库产品: " + metaData.getDatabaseProductName());
            System.out.println("数据库版本: " + metaData.getDatabaseProductVersion());
            System.out.println("驱动名称: " + metaData.getDriverName());
            System.out.println("驱动版本: " + metaData.getDriverVersion());
            
            // 测试简单查询
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT VERSION()");
            if (rs.next()) {
                System.out.println("MySQL版本: " + rs.getString(1));
            }
            rs.close();
            
            // 检查数据库中的表
            System.out.println("\n检查数据库中的表:");
            ResultSet tables = stmt.executeQuery("SHOW TABLES");
            boolean hasTables = false;
            while (tables.next()) {
                hasTables = true;
                System.out.println("  - " + tables.getString(1));
            }
            if (!hasTables) {
                System.out.println("  数据库中没有表");
            }
            tables.close();
            stmt.close();
            
            // 关闭连接
            conn.close();
            System.out.println("\n✅ 数据库连接测试完成！");
            
        } catch (SQLException e) {
            System.err.println("❌ 数据库连接失败:");
            System.err.println("错误代码: " + e.getErrorCode());
            System.err.println("SQL状态: " + e.getSQLState());
            System.err.println("错误信息: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 