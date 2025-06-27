const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        '@app/logger-lib': path.resolve(__dirname, '../../libs/logger-lib/src'),
        '@app/redis-lib': path.resolve(__dirname, '../../libs/redis-lib/src'),
        '@app/pg-lib': path.resolve(__dirname, '../../libs/pg-lib/src'),
        '@app/i18n-lib': path.resolve(__dirname, '../../libs/i18n-lib/src'),
        '@app/shared-dto-lib': path.resolve(__dirname, '../../libs/shared-dto-lib/src'),
      },
      plugins: [
        ...(options.resolve.plugins || []),
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, 'tsconfig.app.json'),
          baseUrl: path.resolve(__dirname, '../..'),
        }),
      ],
    },
    plugins: [
      ...(options.plugins || []),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, '../../libs/i18n-lib/i18n'),
            to: path.resolve(__dirname, '../../dist/apps/auth-service/libs/i18n-lib/i18n'),
          },
        ],
      }),
    ],
  };
}; 