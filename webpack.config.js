const Webpack = require('webpack');
const path = require('path');

process.env.SLS_DEBUG = "*";

module.exports = [
    {
        entry: './lib/handler.js',
        target: 'node',
        externals: ['aws-sdk'],
        output: {
            libraryTarget: 'commonjs',
            path: path.join(__dirname, '.webpack'),
            filename: 'handler.js'
        },
        module: {
            loaders: [
                {
                    test: /\.json$/,
                    loader: 'json-loader'
                },
                {
                    test: /\.js$/,
                    loaders: ['babel-loader'],
                    include: __dirname,
                    exclude: [/node_modules/]
                }
            ]
        },
        plugins: [
            new Webpack.NoEmitOnErrorsPlugin(),
            new Webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: 'production'
                }
            }),
            new Webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            })
        ]
    }
];