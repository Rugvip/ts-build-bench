const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const MODE = 'ts-fork';

const plugins = [new HtmlWebpackPlugin()];
const rules = [];

if (MODE === 'ts-fork') {
  rules.push({
    test: /\.(tsx?|jsx?|mjs)$/,
    exclude: /node_modules/,
    loader: 'ts-loader',
    options: {
      // disable type checker - handled by ForkTsCheckerWebpackPlugin
      transpileOnly: true,
      compilerOptions: {
        module: 'CommonJS',
      },
    },
  });
  plugins.push(new ForkTsCheckerWebpackPlugin());
} else {
  throw new Error('Invalid Webpack Mode');
}

module.exports = {
  mode: 'development',
  profile: false,
  bail: false,
  devtool: 'cheap-module-eval-source-map',
  entry: './src/index.ts',
  context: __dirname,
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
    modules: ['node_modules'],
  },
  module: {
    rules,
  },
  output: {
    publicPath: '/',
    filename: 'bundle.js',
  },
  plugins,
  node: {
    module: 'empty',
    dgram: 'empty',
    dns: 'mock',
    fs: 'empty',
    http2: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
};
