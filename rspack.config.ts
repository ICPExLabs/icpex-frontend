import path from 'node:path'
import { defineConfig } from '@rspack/cli'
// import { HttpsProxyAgent } from 'https-proxy-agent'
import { initCanisterEnv } from './config/env'

export const isProduction = process.env.NODE_ENV === 'production'
console.log("Current DFX_NETWORK:", process.env.DFX_NETWORK,initCanisterEnv());


const config = defineConfig({
  devtool: isProduction ? false : 'cheap-source-map',
  context: __dirname,
  entry: {
    main: './src/main.tsx',
  },
  output: {
    publicPath: '/',
  },
  builtins: {
    html: [
      {
        template: 'index.html',
      },
    ],
    define: {
      'process.env.DFX_NETWORK': process.env.DFX_NETWORK === 'ic' ? JSON.stringify('ic') : JSON.stringify('local'),
      ...initCanisterEnv(),
    },
    provide: {
      process: [require.resolve('process/browser')],
      Buffer: ['buffer', 'Buffer'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    fallback: {
      // assert: require.resolve('assert/'),
      // stream: require.resolve('stream-browserify/'),
      // buffer: require.resolve('buffer'),
      assert: false,
      stream: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.png|jpg$/,
        type: 'asset/resource',
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'less-loader',
          },
        ],
        type: 'css',
      },
      {
        test: /\.module\.less$/,
        use: [
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'less-loader',
          },
        ],
        type: 'css/module',
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 1,
      // minSize: 20000,
      // maxSize: 0,
      // maxAsyncRequests: 30,
      // maxInitialRequests: 30,
      // name: 'vendors',
      cacheGroups: {
        antv: {
          name: 'chunk-antv',
          test: /[\\/]node_modules[\\/]@antv(.*)?[\\/]/,
          chunks: 'initial',
          priority: 40,
        },
        anticons: {
          name: 'chunk-anticons',
          test: /[\\/]node_modules[\\/]@ant-design[\\/]icons(.*)?[\\/]/,
          chunks: 'initial',
          priority: 40,
        },
        bigjs: {
          name: 'big',
          test: /[\\/]node_modules[\\/]big.js(.*)/,
          chunks: 'initial',
          priority: 50,
        },
        antd: {
          name: 'chunk-antd',
          test: /[\\/]node_modules[\\/]antd(.*)?[\\/]/,
          chunks: 'initial',
          priority: 30,
        },
        dfinity: {
          name: 'dfinity',
          test: /[\\/]node_modules[\\/]@dfinity(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        plug: {
          name: 'plug',
          test: /[\\/]node_modules[\\/]@psychedelic(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        ahooks: {
          name: 'ahooks',
          test: /[\\/]node_modules[\\/]ahooks(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        mobx: {
          name: 'mobx',
          test: /[\\/]node_modules[\\/]mobx(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        react: {
          name: 'chunk-react',
          test: /[\\/]node_modules[\\/]react(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        axios: {
          name: 'chunk-axios',
          test: /[\\/]node_modules[\\/]axios(.*)?[\\/]/,
          chunks: 'initial',
          priority: 20,
        },
        rc: {
          name: 'chunk-rc',
          test: /[\\/]node_modules[\\/]rc-(.*)?[\\/]/,
          chunks: 'initial',
          priority: 10,
        },
        bip: {
          name: 'chunk-bip',
          test: /[\\/]node_modules[\\/]bip(.*)?[\\/]/,
          chunks: 'initial',
          priority: 10,
        },
        libs: {
          name: 'chunk-libs',
          test: /[\\/]node_modules[\\/]/,
          priority: 0,
          chunks: 'initial',
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  devServer: {
    open: true,
    static: 'public',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        // target: 'https://icpex.org/',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api',
        },
      },
      '/service': {
        // agent: new HttpsProxyAgent('http://192.168.1.200:7890'),
        target: 'https://metrics.icpex.org/',
        changeOrigin: true,
        secure: false,
        // headers: {
        //   Referer: 'https://icpex.org/',
        // },
        pathRewrite: {
          '^/service': '',
        },
      },
    },
  },
})

// eslint-disable-next-line antfu/no-cjs-exports
module.exports = config
