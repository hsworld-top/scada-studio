import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

/**
 * 代理模块，负责将请求转发到下游微服务
 */
@Module({})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Auth Service 代理
    consumer
      .apply(
        createProxyMiddleware({
          target: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
          changeOrigin: true,
          pathRewrite: {
            '^/api/auth': '/auth',
          },
          onError: (err, req, res) => {
            console.error('Auth Service代理错误:', err.message);
            if (!res.headersSent) {
              res.status(503).json({
                message: 'Auth Service暂时不可用',
                error: 'Service Unavailable',
              });
            }
          },
          onProxyReq: (proxyReq, req) => {
            console.log(`代理请求到Auth Service: ${req.method} ${req.url}`);
          },
        } as Options),
      )
      .forRoutes('/api/auth');

    // Project Studio 代理
    consumer
      .apply(
        createProxyMiddleware({
          target: process.env.PROJECT_STUDIO_URL || 'http://localhost:3003',
          changeOrigin: true,
          pathRewrite: {
            '^/api/project': '/project',
          },
          onError: (err, req, res) => {
            console.error('Project Studio代理错误:', err.message);
            if (!res.headersSent) {
              res.status(503).json({
                message: 'Project Studio暂时不可用',
                error: 'Service Unavailable',
              });
            }
          },
          onProxyReq: (proxyReq, req) => {
            console.log(`代理请求到Project Studio: ${req.method} ${req.url}`);
          },
        } as Options),
      )
      .forRoutes('/api/project');
  }
}
