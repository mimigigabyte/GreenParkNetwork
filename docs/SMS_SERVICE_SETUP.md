# 融信云短信服务集成文档

## 1. 接口基本信息

### 1.1 接口说明
短信平台对外接口，用于实现短信下发功能。

### 1.2 技术标准
- 接口方式：同步HTTPS接口服务
- 编码格式：application/json、UTF-8
- 调用地址：https://sms.bjxunyin.net/
- 请求方式：POST
- 请求URL：/api/smsSend/send

### 1.3 特殊说明
- password（用户密码）格式为 MD5 格式（32位小写）

## 2. 接口参数

### 2.1 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| appId | String | 是 | 应用账号 |
| password | String | 是 | 应用密码（MD5格式） |
| content | String | 是 | 短信内容 |
| mobile | array[string] | 是 | 发送手机号码 |

### 2.2 返回参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | String | 状态码 |
| msg | String | 状态描述 |
| data | array[object] | 返回结果 |
| mobile | String | 手机号 |
| msgId | String | 消息唯一标识ID |

## 3. 使用示例

### 3.1 请求示例
```json
{
  "appId": "your_app_id",
  "password": "md5_hashed_password",
  "content": "您的验证码是：123456，5分钟内有效。",
  "mobile": ["13800138000"]
}
```

### 3.2 返回示例
```json
{
  "code": "0",
  "msg": "发送成功",
  "data": [
    {
      "mobile": "13800138000",
      "msgId": "msg_20240101_001"
    }
  ]
}
```

## 4. 环境变量配置

需要在环境变量中配置以下信息：
```
SMS_APP_ID=your_app_id
SMS_PASSWORD=your_original_password  # 原始密码，系统会自动MD5加密
SMS_BASE_URL=https://sms.bjxunyin.net
```

## 5. 验证码模板

建议的验证码短信模板：
- 注册：`您的注册验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。`
- 登录：`您的登录验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。`
- 重置密码：`您的密码重置验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。`