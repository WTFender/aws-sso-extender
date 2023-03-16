/* eslint-disable */
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");

const isDevMode = process.env.NODE_ENV === 'development'
const platform = process.env.PLATFORM

const path = require('path')
const fs = require('fs')

// Generate pages object
const pages = {}

function getEntryFile(entryPath) {
  let files = fs.readdirSync(entryPath)
  return files
}

const chromeName = getEntryFile(path.resolve(`src/entry`))

function getFileExtension(filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined
}
chromeName.forEach((name) => {
  if (name.includes('devtools') && !isDevMode) { return };
  const fileExtension = getFileExtension(name)
  const fileName = name.replace('.' + fileExtension, '')
  pages[fileName] = {
    entry: `src/entry/${name}`,
    template: 'public/index.html',
    filename: `${fileName}.html`
  }
})

function buildManifest() {
  const env = isDevMode ? 'dev' : 'prod'
  return new MergeJsonWebpackPlugin({
    files: [
      "./src/manifest/default.json",
      `./src/manifest/${platform}.json`,
      `./src/manifest/${env}.json`,
    ],
    output: {
      fileName: "manifest.json",
    },
  });
}


module.exports = {
  pages,
  outputDir: `dist/${platform}/`,
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugin('copy').use(require('copy-webpack-plugin'), [
      {
        patterns: [
          {
            from: path.resolve(`public/`),
            to: path.resolve(`dist/${platform}/`),
          },
          {
            from: path.resolve(`src/manifest/${platform}.json`),
            to: `${path.resolve(`dist/${platform}`)}/manifest.json`
          }
        ]
      },
    ])
  },
  configureWebpack: {
    plugins: [
      buildManifest(),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: `[name].js`,
      chunkFilename: `[name].js`
    },
    devtool: isDevMode ? 'inline-source-map' : false
  },
  css: {
    extract: false // Make sure the css is the same
  }
}
