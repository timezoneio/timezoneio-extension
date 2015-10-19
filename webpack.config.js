module.exports = {
  entry: {
    app: './js/app.js',
    background: './js/background.js'
  },
  output: {
    path: __dirname + '/js',
    filename: '[name]-bundle.js'
  },
  resolve: {
    extensions: ['', '.json', '.jsx', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel?stage=0'],
      },
      {
        include: /\.json$/,
        loaders: ['json-loader']
      }
    ]
  }
};
