'use strict';

const http = require('http');
const { handleWebhook } = require('./handler');

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
