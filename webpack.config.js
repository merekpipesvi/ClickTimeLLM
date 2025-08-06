const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
	entry: {
		background: './src/background.ts',
		popup: './src/popup.ts',
		messageBridge: './src/messageBridge.ts',
		injected: './src/injected.ts',
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
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new Dotenv(),
		new HtmlWebpackPlugin({
			template: './popup.html',
			filename: 'popup.html',
			chunks: ['popup'],
		}),
	],
};
