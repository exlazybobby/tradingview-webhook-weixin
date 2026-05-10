'use strict';

const { sendToWeixin } = require('./weixin');

/**
 * 日志工具（带时间戳和级别）
 */
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
};

/**
 * 必须包含的字段列表
 */
const REQUIRED_FIELDS = ['action', 'ticker', 'exchange', 'interval', 'open', 'close', 'high', 'low', 'time'];

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
 * 读取请求体的原始 Buffer
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
const readBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

/**
 * 处理 POST /webhook 请求
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
const handleWebhook = async (req, res) => {
  const clientIp = req.socket.remoteAddress || 'unknown';
  log.info(`收到 Webhook 请求，来源 IP：${clientIp}`);

  // 读取并解析请求体
  let data;
  try {
    const raw = await readBody(req);
    data = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    log.warn(`请求体解析失败：${e.message}`);
    return sendJson(res, 400, { error: '请求体必须是合法的 JSON 格式' });
  }

  // 校验必要字段
  const missing = REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
  if (missing.length > 0) {
    log.warn(`字段缺失：${missing.join(', ')}`);
    return sendJson(res, 400, {
      error: '缺少必要字段',
      missing,
    });
  }

  log.info(`数据校验通过，ticker=${data.ticker}, action=${data.action}, time=${data.time}`);

  // 推送到企业微信
  try {
    await sendToWeixin(data);
    log.info(`Webhook 处理完成，ticker=${data.ticker}`);
    return sendJson(res, 200, { success: true, message: '消息已发送到企业微信' });
  } catch (e) {
    log.error(`发送企业微信消息失败：${e.message}`);
    return sendJson(res, 502, { error: '发送企业微信消息失败', detail: e.message });
  }
};

module.exports = { handleWebhook };
