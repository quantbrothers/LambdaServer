const path = require('path');
const webpack = require('webpack');
const readdirRec = require('fs-readdir-recursive');

const functionsDir = path.resolve(path.join(__dirname, 'src'));
const modulesDir = path.resolve(path.join(__dirname, '..', '..', 'modules'));
const handlerName = 'handler.js';

const entry = {};
const funstionFiles = readdirRec(functionsDir);
const functionHandlers = funstionFiles.filter((f) => f.endsWith(path.sep + handlerName));

functionHandlers.forEach((handlerPath) => {
  const handlerPaths = handlerPath.split(path.sep);
  handlerPaths.pop();
  const functionName = handlerPaths.join('_');
  entry[functionName] = path.resolve(path.join(functionsDir, handlerPath));
});

module.exports = {
  entry,
  output: {
    libraryTarget: 'commonjs',
    path: path.resolve(path.join(__dirname, '.webpack')),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          plugins: [
            ['babel-plugin-transform-builtin-extend', {
              globals: ['Error', 'Array'],
            }],
            ['transform-runtime'],
          ],
          presets: ['es2015'],
        },
        include: [
          path.resolve(__dirname),
          modulesDir,
        ],
        exclude: [
          /node_modules/,
        ],
      },
    ],
  },
  target: 'node',
  plugins: [
    new webpack.IgnorePlugin(/(\.yaml$)|(\.md$)/),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
};
