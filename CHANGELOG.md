## 1.9.3
- (fix) Search will now filter on profile labels

## 1.9.2
- Add support for health dashboard

## 1.9.1
- (fix) Apply account label names to profile list

## 1.9.0
- Assign labels and colors to your AWS accounts
- Template `{{accountName}}` will resolve to your account label, fallback to account name
- Added setting to override profiles settings with AWS account settings (default: false, inherit)

## 1.8.16
- Fix for role names with underscores not applying console customizations
- Added setting to only navigate current browser tab (default: false)
- Fix IAM label format not applying to AWS Console
- Improve account labels & names overflowing fields
- Add 'copy link' button to [share the current AWS console page](https://docs.aws.amazon.com/singlesignon/latest/userguide/createshortcutlink.html) (thanks @mbourgeois-fetch)
- Fix support for multiple IAM roles per profile
- Support the new IAM switch role form
- UX improvements
- Add setting to hide profiles
- UX improvements
- Fixed inconsistent profile updates when logging-in to the AWS access portal
- Support new AWS access portal
- Respect profile labels when sorting profiles
- Firefox: close extension when navigating to profile
- Fix container expiration to be in minutes, not milliseconds
- Added setting to expire firefox containers after X minutes, ideally set to your session duration
- Added setting to resume firefox containers or create a new one each time
- Expand profile names when no IAM role exists
- Fix toolbar icon sizes
- Move settings to options page
- Add JSON config editor
- Simplify import/export config for easier customizations

## 1.7.9
- Search results now include IAM role name & labels
- Add setting for syncing user settings across browsers; disabling sync increases the number of customizations that can be saved
- Fix Firefox tabs not focusing in correct browser window when opening profile
- Fix profiles not loading
- Set display name for users
- Add setting to show profile icon in the aws console label
- Custom profile icons
- Fix icon color on window open
- Fix finding login links on install
- Change extension icon color
- Keyboard support
  - Set up to 3 hotkeys to open your favorites profile
  - Use arrow keys to browse the profile list, Enter to navigate

## 1.6.10
- Fix searchbox autofocus
- Improve firefox status icon to show active & inactive profile containers
- Fix SAML apps not opening with firefox containers enabled
- Rate limit requests to AWS
- Added a setting to show profiles for all users
- Fixed an issue with duplicate firefox containers
- Firefox: Opening a profile will switch to existing container/tab
- Firefox: Add profile indicator if container/tab is open
- Improve spacing, font and image sizes
- Support all AWS console languages
- Fix profile fonts
- Update profile table style & sizing
- Add table filters🎚️
  - Show/hide icon
  - Show/hide IAM roles
  - Sort by account name
  - Sort by account ID
  - Sort by profile name
  - Custom sort (drag & drop)
- Fix safari transparent background

## 1.5.2
- Add AWS console subdomain
- New profile editor

## 1.4.5
- Safari support
- Set startup page to all profiles or favorites
- Refactored storage to allow for ~500 apps
- Ability to remove IAM roles from profiles
- Show release notes on update / install
- Edit JSON User Config 📝

## 1.3.0
- Firefox Containers for AWS Console 🦊

## 1.2.0
- Assume IAM roles via SSO 🔓
- Customize the AWS console 🎨

## 1.1.0
- Firefox compatibility 🦊
- Discover AWS SSO login URLs from browser history

## 1.0.0
- 🎂
