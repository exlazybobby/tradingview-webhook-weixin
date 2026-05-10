'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleWebhook } = require('./handler');

/**
 * 从项目根目录读取并解析 .env 文件，将 KEY=VALUE 写入 process.env
 * 忽略 # 开头的注释行和空行
 * 文件不存在时静默跳过（try/catch 包裹）
 */
const loadEnvFile = () => {
  const envPath = path.resolve(__dirname, '..', '.env');
  let content;
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    // 文件不存在或无权限读取时静默跳过
    return;
  }

  const lines = content.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    // 跳过空行和注释行
    if (!line || line.startsWith('#')) continue;
    // 只取第一个 = 进行分割，支持 VALUE 中包含 = 的情况
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    // 只设置尚未存在的变量，避免覆盖系统环境变量
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

// 在读取任何环境变量之前加载 .env 文件
loadEnvFile();

/**
 * 日志工具（带时间戳和级别）
 */
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
};

/**
 * 发送 JSON 响应
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} body
 */
const sendJson = (res, statusCode, body) => {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
};

/**
 * 主路由逻辑
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
const router = async (req, res) => {
  const { method, url } = req;

  // 健康检查接口
  if (method === 'GET' && url === '/health') {
    return sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  // Webhook 接收接口
  if (method === 'POST' && url === '/webhook') {
    return handleWebhook(req, res);
  }

  // 其他路由返回 404
  log.warn(`未匹配路由：${method} ${url}`);
  return sendJson(res, 404, { error: '路由不存在' });
};

// 从环境变量读取端口，默认 3000
const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = http.createServer(async (req, res) => {
  try {
    await router(req, res);
  } catch (e) {
    log.error(`未捕获的服务器错误：${e.message}`);
    if (!res.headersSent) {
      sendJson(res, 500, { error: '服务器内部错误' });
    }
  }
});

server.listen(PORT, () => {
  log.info(`TradingView Webhook 服务已启动，监听端口 ${PORT}`);
  log.info(`健康检查：GET http://localhost:${PORT}/health`);
  log.info(`Webhook 接口：POST http://localhost:${PORT}/webhook`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  log.info('收到 SIGTERM 信号，正在关闭服务...');
  server.close(() => {
    log.info('服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log.info('收到 SIGINT 信号，正在关闭服务...');
  server.close(() => {
    log.info('服务已关闭');
    process.exit(0);
  });
});
