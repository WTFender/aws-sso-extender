# aws-sso-extender

🚀 [Install Chrome Extension](https://chrome.google.com/webstore/detail/aws-sso-extender/pojoaiboolahdaedebpjgnllehpofkep)  

🦊 [Install Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/aws-sso-extender/) 

📃 [Read more](https://blog.wtfender.com/posts/aws-sso-extender/)

Extension for AWS SSO (Identity Center) users  

- Quickly login to your favorite applications
- Apply custom labels to your application profiles

https://user-images.githubusercontent.com/12001399/224067799-c3a9a3d0-c0cf-44e2-918b-767c3a1c018f.mov


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