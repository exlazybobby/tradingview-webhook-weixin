'use strict';

// TradingView Webhook → 企业微信 服务首页
module.exports = async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(Buffer.from(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradingView Webhook → 企业微信</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-top: 0; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
    .endpoint { background: #f9f9f9; border-left: 3px solid #07c; padding: 12px 16px; margin: 12px 0; border-radius: 0 4px 4px 0; }
    .method { display: inline-block; background: #07c; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; font-family: monospace; }
    .method.post { background: #e80; }
    .success { color: #0a0; font-weight: bold; }
    a { color: #07c; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 TradingView Webhook → 企业微信</h1>
    <p>服务已部署成功，以下接口可用：</p>

    <div class="endpoint">
      <span class="method">GET</span>
      <span style="margin-left:8px;font-family:monospace;">/health</span>
      <p style="margin:8px 0 4px 0;">健康检查接口</p>
      <code>curl https://tradingview-webhook-weixin-xub.vercel.app/health</code>
    </div>

    <div class="endpoint">
      <span class="method post">POST</span>
      <span style="margin-left:8px;font-family:monospace;">/webhook</span>
      <p style="margin:8px 0 4px 0;">接收 TradingView 警报并转发到企业微信</p>
      <code style="display:block;margin-top:4px;white-space:pre-line;">curl -X POST https://tradingview-webhook-weixin-xub.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"action":"buy","ticker":"BTCUSDT","exchange":"BINANCE","interval":"1H","open":43250.50,"close":43890.75,"high":44100.00,"low":43100.25,"time":"2026-05-10T06:00:00Z"}'</code>
    </div>

    <h3>✅ 部署状态</h3>
    <p class="success">● 服务运行中</p>
    <p>GitHub 仓库：<a href="https://github.com/exlazybobby/tradingview-webhook-weixin" target="_blank">exlazybobby/tradingview-webhook-weixin</a></p>
  </div>
</body>
</html>
  `.trimEnd()));
};
