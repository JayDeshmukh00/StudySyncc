const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      // --- NEW: Add a longer timeout for slow AI requests ---
      proxyTimeout: 300000 
    })
  );
};
