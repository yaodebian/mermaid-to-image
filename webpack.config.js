const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    popup: './src/popup/index.tsx',
    content: './src/content/index.ts',
    background: './src/background/index.ts',
    renderer: './src/renderer/index.js',
    preview: './src/preview/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/template.html',
      filename: 'mermaid-renderer.html',
      chunks: ['renderer'],
    }),
    new HtmlWebpackPlugin({
      template: './src/preview/index.html',
      filename: 'preview.html',
      chunks: ['preview'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'icons', to: 'icons' },
      ],
    }),
  ],
}; 