'use strict';

const { handleWebhook } = require('../src/handler');
const { sendToWeixin } = require('../src/weixin');

// Vercel 无服务器函数入口
// POST /api/webhook -> 接收 TradingView webhook，转发到企业微信

module.exports = async (req, res) => {
  // 仅允许 POST 方法
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
    return;
  }

  // Vercel 的 req/res 与 Node.js http 模块兼容
  // 直接复用已有的 handleWebhook 逻辑
  await handleWebhook(req, res);
};
