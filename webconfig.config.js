const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: './src/app.ts',
  output: {
    filename: 'js/bundleName.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    host: 'localhost',
    port: 8080, //port that we're using for local host (localhost:8080)
    static: path.resolve(appDirectory, 'public'), //tells webpack to serve from the public folder
    hot: true,
    devMiddleware: {
      publicPath: '/',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(appDirectory, 'public/index.html'),
    }),
  ],
  mode: 'development',
};
