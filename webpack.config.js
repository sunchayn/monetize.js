const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const output = isProduction ? 'monetize.min.js' : 'monetize.js';

module.exports = [
  'source-map',
].map((devtool) => ({
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: output,
    library: 'monetize',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this',
  },
  devtool,
  optimization: {
    minimize: isProduction,
  },
}));
