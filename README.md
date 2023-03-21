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
Load unpacked extension from `dist/chrome/`

```
npm install
npm run watch:chrome
```
```
npm run build:chrome
```

### Firefox
A new window will open with the extension installed.

```
npm install
npm run watch:firefox # terminal 1
npm run serve:firefox # terminal 2
```

```
npm run build:firefox
```

## Releases
1. Update `CHANGELOG.md`
2. Update version in `manifest/default.json`
3. Run `Create Release` Action to build packages
4. Upload packages to publishers