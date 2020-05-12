const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { ESBuildPlugin } = require('esbuild-loader');

const MODE = 'ts-fork';

const plugins = [new HtmlWebpackPlugin()];
const rules = [];

if (MODE.startsWith('ts-fork')) {
  rules.push({
    test: /\.tsx?$/,
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
} else if (MODE.startsWith('ts-transpile')) {
  rules.push({
    test: /\.tsx?$/,
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
} else if (MODE.startsWith('esbuild-transpile')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'esbuild-loader',
      options: {
        target: 'es2019',
      },
    },
  });
  plugins.push(new ESBuildPlugin());
} else if (MODE.startsWith('sucrase-transpile')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: '@sucrase/webpack-loader',
    options: {
      transforms: ['typescript', 'jsx', 'imports'],
    },
  });
} else if (MODE.startsWith('babel-transpile')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
  });
} else if (MODE.startsWith('sucrase-fork')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: '@sucrase/webpack-loader',
    options: {
      transforms: ['typescript', 'jsx', 'imports'],
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
  devtool: MODE.endsWith('-sourcemap') ? 'eval-cheap-module-source-map' : false,
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
};
