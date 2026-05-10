'use strict';

const https = require('https');
const url = require('url');

/**
 * 日志工具（带时间戳和级别）
 */
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
};

/**
 * 将 action 转换为中文方向描述和 emoji
 * @param {string} action - 操作方向
 * @returns {{ emoji: string, label: string }}
 */
const parseAction = (action) => {
  const map = {
    buy:         { emoji: '🟢', label: '做多' },
    long:        { emoji: '🟢', label: '做多' },
    sell:        { emoji: '🔴', label: '做空' },
    short:       { emoji: '🔴', label: '做空' },
    close_long:  { emoji: '🟡', label: '平多' },
    close_short: { emoji: '🟡', label: '平空' },
  };
  return map[action.toLowerCase()] || { emoji: '⚪', label: action.toUpperCase() };
};

/**
 * 将 ISO 8601 时间字符串转换为北京时间（UTC+8）显示
 * @param {string} isoTime - ISO 8601 时间字符串（如 "2026-05-10T06:00:00Z"）
 * @returns {string} - 北京时间字符串，如 "2026-05-10 14:00:00"
 */
const toBeijingTime = (isoTime) => {
  const date = new Date(isoTime);
  // 北京时间 = UTC+8
  const bjTimestamp = date.getTime() + 8 * 60 * 60 * 1000;
  const bjDate = new Date(bjTimestamp);
  // bjDate 的时间戳已经是 UTC+8，用 getUTC* 方法读取即得到北京时间
  const y = bjDate.getUTCFullYear();
  const mo = String(bjDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(bjDate.getUTCDate()).padStart(2, '0');
  const h = String(bjDate.getUTCHours()).padStart(2, '0');
  const mi = String(bjDate.getUTCMinutes()).padStart(2, '0');
  const s = String(bjDate.getUTCSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
};

/**
 * 格式化价格，保留 2 位小数
 * @param {number|string} price
 * @returns {string}
 */
const formatPrice = (price) => Number(price).toFixed(2);

/**
 * 构建企业微信 markdown 消息内容
 * @param {object} data - 来自 TradingView 的结构化数据
 * @returns {string} - markdown 文本
 */
const buildMarkdown = (data) => {
  const { action, ticker, exchange, interval, open, close, high, low, time } = data;
  const { emoji, label } = parseAction(action);
  const bjTime = toBeijingTime(time);

  return [
    `## ${emoji} ${label}信号 - ${ticker}`,
    `> 交易所：${exchange} | 周期：${interval}`,
    ``,
    `**价格信息**`,
    `开盘价：<font color="info">${formatPrice(open)}</font>`,
    `收盘价：<font color="warning">${formatPrice(close)}</font>`,
    `最高价：${formatPrice(high)}`,
    `最低价：${formatPrice(low)}`,
    ``,
    `**收盘时间**：${bjTime} (UTC+8)`,
  ].join('\n');
};

/**
 * 向企业微信 Webhook 发送 markdown 消息
 * @param {object} data - 来自 TradingView 的结构化数据
 * @returns {Promise<void>}
 */
const sendToWeixin = (data) => {
  return new Promise((resolve, reject) => {
    const webhookUrl = process.env.WEIXIN_WEBHOOK_URL;
    if (!webhookUrl) {
      return reject(new Error('环境变量 WEIXIN_WEBHOOK_URL 未配置'));
    }

    const content = buildMarkdown(data);
    const payload = JSON.stringify({
      msgtype: 'markdown',
      markdown: { content },
    });

    const urlObj = url.parse(webhookUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.errcode === 0) {
            log.info(`企业微信消息发送成功，ticker=${data.ticker}`);
            resolve(result);
          } else {
            log.warn(`企业微信返回错误：errcode=${result.errcode}, errmsg=${result.errmsg}`);
            reject(new Error(`企业微信 API 错误：${result.errmsg}（errcode=${result.errcode}）`));
          }
        } catch (e) {
          reject(new Error(`解析企业微信响应失败：${body}`));
        }
      });
    });

    req.on('error', (err) => {
      log.error(`发送企业微信请求失败：${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { sendToWeixin };
