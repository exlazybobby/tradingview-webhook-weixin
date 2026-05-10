# TradingView Webhook 转发企业微信

将 TradingView 策略警报通过 Webhook 实时推送到企业微信群机器人的 Node.js 服务。

---

## 1. 项目介绍

本服务接收 TradingView 发出的 Webhook 请求，解析其中的交易信号数据（交易对、方向、价格等），格式化为企业微信 Markdown 消息后，通过企业微信群机器人 API 推送到指定群组。

**特点：**
- 使用 Node.js 内置模块（`http`/`https`），无第三方依赖
- 时间自动转换为北京时间（UTC+8）显示
- 支持多种交易方向：做多、做空、平多、平空
- 完善的错误处理与控制台日志

---

## 2. 快速开始

### 环境要求

- Node.js >= 18.x（支持 `--watch` 开发模式需要 18+）

### 安装步骤

```bash
# 克隆或下载项目
cd tradingview-webhook-weixin

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env，填入你的企业微信 Webhook 地址
vi .env

# 启动服务
npm start
```

---

## 3. 环境变量配置

将 `.env.example` 复制为 `.env`，并填写以下配置项：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PORT` | 服务监听端口 | `3000` |
| `WEIXIN_WEBHOOK_URL` | 企业微信群机器人 Webhook 完整地址 | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key` |

> **注意**：`.env` 文件已被 `.gitignore` 忽略，请勿提交到代码仓库。

加载环境变量的方式（Node.js 20.6+ 内置支持）：

```bash
node --env-file=.env src/server.js
```

或使用 dotenv：
```bash
npm install dotenv
# 在 server.js 顶部添加：require('dotenv').config()
```

---

## 4. TradingView 端配置

### 4.1 警报消息 JSON

在 TradingView 创建警报时，将以下 JSON 填写到"消息"（Message）文本框中：

```json
{
  "action": "{{strategy.order.action}}",
  "ticker": "{{ticker}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}",
  "open": {{open}},
  "close": {{close}},
  "high": {{high}},
  "low": {{low}},
  "time": "{{time}}"
}
```

> **注意**：`open`、`close`、`high`、`low` 为数值类型，不加引号。

### 4.2 Webhook URL 设置

在 TradingView 警报设置中，勾选 **Webhook URL** 选项，填写：

```
http://your-server-ip:3000/webhook
```

> 如果服务部署在公网服务器上，请将 `your-server-ip` 替换为实际 IP 或域名。TradingView 要求 Webhook 地址必须能从公网访问。

---

## 5. 企业微信端配置

### 5.1 创建群机器人

1. 打开企业微信，进入目标群聊
2. 点击右上角「...」→「添加群机器人」
3. 点击「新创建一个机器人」，填写机器人名称
4. 创建成功后，复制 **Webhook 地址**（格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx`）
5. 将该地址填入 `.env` 文件的 `WEIXIN_WEBHOOK_URL`

---

## 6. 本地测试

### 6.1 启动服务

```bash
# 生产模式
npm start

# 开发模式（文件变更自动重启，需 Node.js 18+）
npm run dev
```

### 6.2 健康检查

```bash
curl http://localhost:3000/health
```

预期响应：
```json
{"status":"ok","timestamp":"2024-01-15T08:00:00.000Z"}
```

### 6.3 模拟 TradingView Webhook

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "buy",
    "ticker": "BTCUSDT",
    "exchange": "BINANCE",
    "interval": "1H",
    "open": 43250.00,
    "close": 43890.50,
    "high": 44100.00,
    "low": 43100.00,
    "time": "2024-01-15T00:00:00Z"
  }'
```

预期响应：
```json
{"success":true,"message":"消息已发送到企业微信"}
```

### 6.4 测试缺失字段（预期返回 400）

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"action": "buy", "ticker": "BTCUSDT"}'
```

---

## 7. 部署建议

### 使用 PM2（推荐）

```bash
npm install -g pm2
pm2 start src/server.js --name tradingview-webhook
pm2 save
pm2 startup
```

### 使用 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker build -t tradingview-webhook .
docker run -d -p 3000:3000 --env-file .env tradingview-webhook
```

> **注意**：TradingView Webhook 需要服务能被公网访问，本地开发可使用 [ngrok](https://ngrok.com/) 做内网穿透。

---

## 8. 消息效果预览

收到 TradingView 做多信号时，企业微信群将收到如下格式的消息：

```
## 🟢 做多信号 - BTCUSDT
> 交易所：BINANCE | 周期：1H

**价格信息**
开盘价：43250.00（蓝色高亮）
收盘价：43890.50（橙色高亮）
最高价：44100.00
最低价：43100.00

**收盘时间**：2024-01-15 08:00:00 (UTC+8)
```

不同信号方向对应不同 emoji：
- 🟢 做多（buy / long）
- 🔴 做空（sell / short）
- 🟡 平多（close_long）
- 🟡 平空（close_short）

---

## 接口说明

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/webhook` | 接收 TradingView 警报 |
