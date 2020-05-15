const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const output = isProduction ? 'monetize.min.js' : 'monetize.js';

module.exports = [
  'source-map',
].map((devtool) => ({
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
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
