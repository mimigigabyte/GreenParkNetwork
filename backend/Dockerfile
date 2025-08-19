# 多阶段构建Dockerfile

# 构建阶段
FROM maven:3.9.6-openjdk-17-slim AS build

# 设置工作目录
WORKDIR /app

# 复制pom.xml和src目录
COPY pom.xml .
COPY src ./src

# 构建应用
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:17-jre-slim

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户
RUN addgroup --system spring && adduser --system spring --ingroup spring

# 设置工作目录
WORKDIR /app

# 从构建阶段复制jar包
COPY --from=build /app/target/platform.jar app.jar

# 更改文件所有者
RUN chown spring:spring app.jar

# 切换到应用用户
USER spring:spring

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health/ping || exit 1

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]