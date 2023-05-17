# aws-sso-extender

[![](https://github.com/WTFender/aws-sso-extender/actions/workflows/codeql.yml/badge.svg?event=push)](https://github.com/WTFender/aws-sso-extender/actions/workflows/codeql.yml)

[Install Chrome Extension](https://chrome.google.com/webstore/detail/aws-sso-extender/pojoaiboolahdaedebpjgnllehpofkep)  |  [Install Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/aws-sso-extender/)  |  [Read more](https://blog.wtfender.com/posts/aws-sso-extender/)  

🚀 Quickly access AWS SSO applications  
⭐ Favorite, rename, and organize your most used applications  
🎨 Label and customize the AWS console  
🔑 Assume IAM roles from your SSO profiles  

https://user-images.githubusercontent.com/12001399/229891725-044d0632-8de1-47bd-80d1-936141d93831.mp4

## Dev & Build

### Chrome
```
npm install
npm run watch:chrome # dev
npm run build:chrome # prod
```
### Firefox
```
npm install
npm run watch:firefox # dev
npm run build:firefox # prod
```
## Releases
1. Update `CHANGELOG.md`
2. Update version in `package.json`
3. Open PR to `release` branch to build packages
4. Upload packages to publishers
