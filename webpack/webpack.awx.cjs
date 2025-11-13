const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const webpackConfig = require('./webpack.config');
const env = require('./environment.cjs');
const { AWX_SERVER } = env;
const proxyUrl = new URL(AWX_SERVER);
module.exports = function (env, argv) {
  const config = webpackConfig(env, argv);
  config.entry = './frontend/awx/main/Awx.tsx';

  // publicPath is the path where the bundle is served from
  // https://webpack.js.org/guides/public-path/
  config.output.publicPath = process.env.PUBLIC_PATH || process.env.ROUTE_PREFIX || '/';

  // FavIcons
  config.plugins.unshift(
    new FaviconsWebpackPlugin({
      logo: './frontend/assets/awx-icon.svg',
      inject: true,
    })
  );

  config.devServer.proxy = [
    {
      target: AWX_SERVER,
      secure: false,
      pathRewrite: { '^/api': '' },
      bypass: (req) => {
        if (req.url.startsWith('/api')) {
          req.headers.host = proxyUrl.host;
          req.headers.origin = proxyUrl.origin;
          req.headers.referer = proxyUrl.href;
        }
      },
    },
    {
      target: AWX_SERVER,
      secure: false,
      pathRewrite: { '^/sso': '' },
      bypass: (req, res, options) => {
        if (req.url.startsWith('/sso')) {
          req.headers.origin = proxyUrl.origin;
          req.headers.host = getRawHeader(req.rawHeaders, 'Host') || proxyUrl.host;
          req.referrer = getRawHeader(req.rawHeaders, 'Referer') || proxyUrl.href;
        }
      },
    },
    {
      target: AWX_SERVER,
      secure: false,
      ws: true,
      changeOrigin: true,
      pathRewrite: { '^/websocket': '' },
    },
  ];
  return config;
};

function getRawHeader(rawHeaders, headerName) {
  const index = rawHeaders.indexOf(headerName);
  if (index === -1) {
    return null;
  }
  return rawHeaders[index + 1];
}
