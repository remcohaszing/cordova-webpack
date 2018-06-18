const fs = require('fs');
const path = require('path');

const merge = require('webpack-merge');
const webpack = require('webpack');


module.exports = (context) => {
  const {
    ConfigParser,
    CordovaLogger,
  } = context.requireCordovaModule('cordova-common');

  const { projectRoot } = context.opts;
  const { release } = context.opts.options;
  const mode = release ? 'production' : 'development';

  const cordovaConfig = new ConfigParser(path.join(projectRoot, 'config.xml'));
  const webpackConfigPath = path.resolve(projectRoot, cordovaConfig.getPreference('webpack-config') || 'webpack.config.js');
  const webpackConfigDefaults = {
    mode,
    devtool: release ? false : 'inline-source-map',
  };
  const webpackConfigOverrides = {
    output: {
      path: path.join(projectRoot, 'www'),
    },
    plugins: [
      new webpack.ProgressPlugin(),
    ],
  };
  let webpackConfig;
  if (fs.existsSync(webpackConfigPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    webpackConfig = require(webpackConfigPath);
    if (webpackConfig instanceof Function) {
      webpackConfig = webpackConfig(undefined, {
        cordova: context,
        mode,
      });
    }
  } else {
    webpackConfig = {};
  }

  webpackConfig = merge(webpackConfigDefaults, webpackConfig, webpackConfigOverrides);

  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      CordovaLogger.get().log(CordovaLogger.INFO, stats.toString({
        colors: true,
      }));
      resolve();
    });
  });
};
