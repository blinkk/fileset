const glob = require('glob');
const path = require('path');

module.exports = env => {
  return {
    entry: ['./src/webui/main.tsx'].concat(
      glob.sync('./src/webui/sass/**/*.sass', {
        ignore: ['./src/webui/sass/**/_*'],
      })
    ),
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    mode: 'development',
    plugins: [],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, './src/webui/tsconfig.json'),
          },
          include: [path.resolve(__dirname, './src/webui/')],
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          exclude: /node_modules/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].min.css',
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].min.js',
    },
  };
};
