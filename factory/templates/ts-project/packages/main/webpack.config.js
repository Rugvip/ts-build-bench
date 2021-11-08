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
} else if (MODE.startsWith('sucrase-transpile-split')) {
  rules.push({
    test: /\.ts$/,
    exclude: /node_modules/,
    loader: '@sucrase/webpack-loader',
    options: {
      transforms: ['typescript', 'imports'],
    },
  });
  rules.push({
    test: /\.tsx$/,
    exclude: /node_modules/,
    loader: '@sucrase/webpack-loader',
    options: {
      transforms: ['typescript', 'jsx', 'imports'],
    },
  });
} else if (MODE.startsWith('babel-standard')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/env',
          {
            targets: {
              chrome: 85,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
    },
  });
} else if (MODE.startsWith('babel-cache')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/env',
          {
            targets: {
              chrome: 85,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
    },
  });
} else if (MODE.startsWith('babel-split')) {
  rules.push({
    test: /\.ts$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/env',
          {
            targets: {
              chrome: 85,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
    },
  });
  rules.push({
    test: /\.tsx$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/env',
          {
            targets: {
              chrome: 85,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
    },
  });
} else if (MODE.startsWith('babel-bugfix')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
        [
          '@babel/env',
          {
            bugfix: true,
            targets: {
              chrome: 85,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
    },
  });
} else if (MODE.startsWith('swc-transpile')) {
  rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loader: 'swc-loader',
    options: {},
  });
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
