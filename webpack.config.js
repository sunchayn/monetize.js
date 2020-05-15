const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
// const output = isProduction ? '[name].min.js' : '[name].js';
const output = '[name].js';

module.exports = [
  'source-map',
].map((devtool) => ({
  mode: isProduction ? 'production' : 'development',
  entry: {
    monetize: ['./src/monetize.js'],
    simulator: ['./src/simulator.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: output,
    library: '[name]',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this',
  },
  devtool,
  optimization: {
    minimize: isProduction,
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.html$/i,
        use: [
          'html-loader',
        ],
      },
    ],
  },
}));
