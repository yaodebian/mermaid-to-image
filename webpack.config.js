const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    popup: './src/popup/index.tsx',
    content: './src/content/index.ts',
    background: './src/background/index.ts',
    renderer: './src/renderer/index.jsx',
    preview: './src/preview/index.tsx',
    sidebar: './src/sidebar/index.tsx',
    converter: './src/converter/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'async',
      minSize: 500000,
      cacheGroups: {
        default: false,
        defaultVendors: false,
        mermaid: {
          test: /[\\/]node_modules[\\/]mermaid[\\/]/,
          name: 'mermaid-vendor',
          priority: 10,
          enforce: true,
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', {runtime: 'automatic'}]
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/template.html',
      filename: 'mermaid-renderer.html',
      chunks: ['renderer'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      template: './src/preview/index.html',
      filename: 'preview.html',
      chunks: ['preview'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      template: './src/sidebar/index.html',
      filename: 'sidebar.html',
      chunks: ['sidebar'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      template: './src/converter/index.html',
      filename: 'converter.html',
      chunks: ['converter'],
      inject: 'body'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'icons', to: 'icons' },
      ],
    }),
  ],
}; 