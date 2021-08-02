/**
 * webpack.dev.config.js
 * 
 * webpack configuration for development mode
 * Will run a http server providing the webapp
 * on http://localhost:3000/
 * 
 * Copyright 2019-2021 Nicolas Mora <mail@babelouest.org>
 * 
 */

var path = require('path');

module.exports = {
	mode: 'development',
	entry: {
		hutch: path.resolve(__dirname, 'src/hutch.js')
	},
	devtool: 'inline-source-map',
	output: {
		path: path.resolve(__dirname),
		filename: '[name].js',
		libraryTarget: 'umd'
	},

	devServer: {
		contentBase: path.resolve(__dirname),
		compress: true,
		port: 3000,
		host: 'localhost',
		open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4884/',
        secure: false,
        changeOrigin: true
      },
      '/.well-known/hutch-configuration': {
        target: 'http://localhost:4884/',
        secure: false,
        changeOrigin: true
      },
      '/jwks': {
        target: 'http://localhost:4884/',
        secure: false,
        changeOrigin: true
      }
    }
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				include: [ path.resolve(__dirname, "src") ],
				exclude: [ path.resolve(__dirname, "node_modules") ],
				loader: 'babel-loader',
				options: {
					presets: ['@babel/env','@babel/react']
				}
			},
			{
				test: /\.css$/,
				loader: 'style-loader!css-loader'
			}
		]
	}
}
