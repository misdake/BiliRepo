const path = require('path');
const webpack = require("webpack");

const os = require('os');
const ifaces = os.networkInterfaces();

let ip = undefined;
let port = "8081";
Object.keys(ifaces).forEach(function (ifname) {
    for (const iface of ifaces[ifname]) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            continue;
        }
        if (!ip) {
            ip = iface.address;
            console.log(ip);
        }
        break;
    }
});
ip = ip || "0.0.0.0";

module.exports = {
    entry: {
        index: './src/viewer/index/index.ts',
        member: './src/viewer/index/member.ts',
        watch: './src/viewer/watch/watch.ts',
        download: './src/viewer/download/download.ts',
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
    plugins: [
        new webpack.DefinePlugin({
            'serverConfig': {
                'apiRoot': JSON.stringify(`http://${ip}:${port}`)
            },
        })
    ],
    resolve: {
        modules: ["src", "node_modules"],
        extensions: ['.ts', '.js', '.html'],
    },
    output: {
        path: path.resolve(__dirname, '.'),
        filename: 'dist/[name].js'
    },
    externals: {},
    devServer: {
        publicPath: "/",
        contentBase: "./static",
        host: ip,
        open: true,
        hot: true,
        compress: true,
        port: 9000,
    },
};
