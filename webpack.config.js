const path = require('path');
const webpack = require("webpack");

const os = require('os');
const ifaces = os.networkInterfaces();

module.exports = env =>{

    let devtool = env && env.production ? undefined : "source-map";
    let mode = env && env.production ? 'production' : 'development';

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
                if (!env || !env.production) console.log(ip);
            }
            break;
        }
    });
    ip = ip || "0.0.0.0";
    let apiRoot = env && env.production ? "" : `http://${ip}:${port}/`;

    return {
        entry: {
            index: './src/viewer/index/index.ts',
            member: './src/viewer/index/member.ts',
            watch: './src/viewer/watch/watch.ts',
            download: './src/viewer/download/download.ts',
        },
        devtool: devtool,
        mode: mode,
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
                    'apiRoot': JSON.stringify(apiRoot)
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
}
