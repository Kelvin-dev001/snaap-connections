const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding
      },
      onProxyReq: (proxyReq) => {
        // Add headers for the proxy request
        proxyReq.setHeader('X-Forwarded-Proto', 'https');
        proxyReq.setHeader('X-Forwarded-Host', 'localhost:3000');
      },
      onProxyRes: (proxyRes) => {
        // Ensure JSON content type
        proxyRes.headers['content-type'] = 'application/json';
        // Remove CORS headers since we're proxying
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-credentials'];
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          success: false,
          message: 'Proxy error occurred',
          details: err.message
        }));
      }
    })
  );
};