/**
 * webpack.config.js
 * 
 * webpack configuration for build in production
 * 
 * Copyright 2019-2021 Nicolas Mora <mail@babelouest.org>
 * 
 */

var path = require('path');
var webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: {
		hutch: path.resolve(__dirname, 'src/hutch.js')
	},
	output: {
		path: path.resolve(__dirname, 'output'),
		filename: '[name].js',
		libraryTarget: 'umd'
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
	},

	 plugins: [
		new webpack.DefinePlugin({
			"process.env": { 
				NODE_ENV: JSON.stringify("production") 
			}
		}),
		new UglifyJsPlugin({
			test: /\.js($|\?)/i,
			sourceMap: true,
			uglifyOptions: {
        mangle: {
          keep_fnames: true
        },
        warnings: false,
        output: {
          beautify: false
        }
			}
		})
	],
  
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	}
}
