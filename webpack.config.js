const path = require('path');

module.exports = {
    entry: {
        index: './src/viewer/index/index.ts',
        member: './src/viewer/index/member.ts',
        watch: './src/viewer/watch/watch.ts',
    },
    devtool: "source-map",
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/, /server/],
            },
        ],
    },
    resolve: {
        modules: ["src", "node_modules"],
        extensions: ['.ts', '.js', '.html'],
    },
    output: {
        path: path.resolve(__dirname, '.'),
        filename: 'dist/[name].js'
    },
    externals: {
    },
    devServer: {
        publicPath: "/",
        contentBase: "./static",
        open: true,
        hot: true,
        compress: true,
        port: 9000,
    },
};
