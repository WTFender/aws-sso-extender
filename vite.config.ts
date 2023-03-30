import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

type platform = 'chrome' | 'firefox';
type action = 'build' | 'watch';

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    author: pkg.author,
    homepage_url: pkg.url,
    ...manifest,
  };
}

function generateManifestDevtools() {
  const manifest = generateManifest();
  manifest['devtools_page'] = 'src/devtools.html';
  return manifest;
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const action = mode.split(':')[0] as action;
  const platform = mode.split(':')[1] as platform;
  return {
    build: {
      outDir: `./dist/${platform}/`
    },
    plugins: [
      vue(),
      webExtension({
        browser: platform,
        manifest: action === 'watch' ? generateManifestDevtools : generateManifest,
        watchFilePaths: ["package.json", "manifest.json"],
      }),
    ],
  }
})
