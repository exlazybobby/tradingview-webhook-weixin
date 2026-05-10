'use strict';

module.exports = async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradingView Webhook → 企业微信</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
    .container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
    .endpoint { background: #f9f9f9; border-left: 3px solid #07c; padding: 12px 16px; margin: 12px 0; }
    .method { display: inline-block; background: #07c; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
    .url { font-family: monospace; margin-left: 8px; }
    .success { color: #0a0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 TradingView Webhook → 企业微信</h1>
    <p>服务已部署成功，以下接口可用：</p>

    <div class="endpoint">
      <span class="method">GET</span>
      <span class="url">/health</span>
      <p>健康检查接口</p>
      <pre><code>curl https://tradingview-webhook-weixin-xub.vercel.app/health</code></pre>
    </div>

    <div class="endpoint">
      <span class="method" style="background:#e80;">POST</span>
      <span class="url">/webhook</span>
      <p>接收 TradingView 警报并转发到企业微信</p>
      <pre><code>curl -X POST https://tradingview-webhook-weixin-xub.vercel.app/webhook \\
  -H "Content-Type: application/json" \\
  -d '{"action":"buy","ticker":"BTCUSDT",...}'</code></pre>
    </div>

    <h3>✅ 部署状态</h3>
    <p class="success">● 服务运行中</p>
    <p>仓库：<a href="https://github.com/exlazybobby/tradingview-webhook-weixin" target="_blank">github.com/exlazybobby/tradingview-webhook-weixin</a></p>
  </div>
</body>
</html>
  `);
};
