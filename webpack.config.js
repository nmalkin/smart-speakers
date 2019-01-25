const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_PATH = path.resolve(__dirname, 'chrome_extension');

module.exports = [
    {
        entry: {
            background: './src/chrome/background/background.ts',
            content: './src/chrome/content/content.ts',
            index: './src/chrome/pages/index.ts',
            survey: './src/chrome/pages/survey.ts',
            diagnostics: './src/chrome/pages/diagnostics.ts'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: { onlyCompileBundledFiles: true },
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        output: {
            filename: '[name].js',
            path: BUILD_PATH
        },
        mode: 'none',
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'src/chrome/manifest.json',
                    to: ''
                },
                {
                    from: 'assets/**/*',
                    to: ''
                }
            ])
        ]
    }
];
