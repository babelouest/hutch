const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, './src/hutch.js'),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'hutch.js',
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devServer: {
    static: path.resolve(__dirname, './dist'),
    hot: true,
    compress: true,
    port: 3000,
    host: 'localhost',
    open: true
  },
};
