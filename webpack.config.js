const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const dir = path.join(__dirname, "src");

module.exports = {
    entry: {
        background: path.join(dir, "background.ts"),
        popup: path.join(dir, "popup.ts"),
        options: path.join(dir, "options.ts"),
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "src/manifest.json",
                    to: "."
                },
                {
                    from: "src/images",
                    to: "images"
                },
                {
                    from: "src/style.css",
                    to: "."
                },
                {
                    from: "src/popup.css",
                    to: "."
                },
                {
                    from: "src/popup.html",
                    to: "."
                },
                {
                    from: "src/options.html",
                    to: "."
                },
                {
                    from: "node_modules/bootstrap/dist/css/bootstrap.min.css",
                    to: "third-party"
                },
                {
                    from: "node_modules/awesomplete/awesomplete.css",
                    to: "third-party"
                },
                {
                    from: "node_modules/jquery/dist/jquery.min.js",
                    to: "third-party"
                },
                {
                    from: "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
                    to: "third-party"
                },
                {
                    from: "node_modules/awesomplete/awesomplete.min.js",
                    to: "third-party"
                },
                {
                    from: "node_modules/chart.js/dist/chart.min.js",
                    to: "third-party"
                }
            ]
        })
    ],
    mode: "production"
}