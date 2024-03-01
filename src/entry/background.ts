import extension from '../extension';
import { ExtensionData, ExtensionMessage, ExtensionSettings } from '../types';
import { createFirefoxContainer, listenConsole } from '../utils';

extension.log('background:init');
extension.loadData().then((data: ExtensionData) => {
  // set extension icon color
  extension.config.browser.action.setIcon({
    path: `/icons/${data.settings.iconColor}/128.png`,
  });

  // listen for hotkey commands
  extension.config.browser.commands.onCommand.addListener((command) => {
    extension.log(`background:command:${command}`);
    // message popup to open profile
    if (command.startsWith('openProfile')) {
      extension.log(data);
      const user = extension.findUser(data);
      const appProfileId = user.custom.hotkeys[command];
      extension.log(`background:command:appProfileId:${appProfileId}`);
      const appProfiles = extension.customizeProfiles(
        data.users[0],
        data.appProfiles,
      );
      const appProfile = extension.findAppProfileById(
        appProfileId,
        appProfiles,
      );
      extension.log(appProfile);
      extension.navSelectedProfile(
        appProfile,
        data.users[0],
        data.users,
        data.settings,
      );
    }
  });

  // show release notes on install & update
  extension.config.browser.runtime.onInstalled.addListener((details) => {
    const manifest = extension.config.browser.runtime.getManifest();
    extension.log(`currentVersion: ${manifest.version}`);
    if (details.reason === 'update') {
      if (details.previousVersion !== manifest.version) {
        extension.log(`previousVersion: ${details.previousVersion}`);
        extension.loadSettings().then((settings: ExtensionSettings) => {
          if (settings.showReleaseNotes) {
            const html = `<h2>${extension.config.display} - Updated</h2>
          <a href="https://github.com/WTFender/aws-sso-extender/releases/tag/v${manifest.version}">
            ${manifest.version} Release Notes
          </a>`;
            extension.config.browser.tabs.create({
              url: `data:text/html;base64,${btoa(html)}`,
            });
          }
        });
      }
    }
  });

  if (extension.platform === 'firefox') {
    // setup listeners on message / settings change
    extension.config.browser.runtime.onMessage.addListener(
      (msg: ExtensionMessage) => {
        extension.checkPermissions().then((permissions) => {
          extension.log(`background:action:${msg.action}`);
          if (msg.action === 'enableFirefoxContainers') {
            if (permissions.containers) {
              listenConsole();
            }
          } else if (msg.action === 'disableFirefoxContainers') {
            if (permissions.containers) {
              // eslint-disable-next-line vue/max-len
              extension.config.browser.webRequest.onBeforeRequest.removeListener(
                createFirefoxContainer,
              );
            }
          } else if (msg.action === 'expireFirefoxContainer') {
            // remove container
            setTimeout(() => { 
              extension.log('background:expireFirefoxContainer');
              extension.config.browser.contextualIdentities.remove(msg.cookieStoreId!);
            }, data.settings.firefoxExpireMinsContainer);
          }
        });
      },
    );

    // startup listeners
    extension.checkPermissions().then((permissions) => {
      // permissions
      if (permissions.containers && data.settings.firefoxContainers) {
        listenConsole();
      }
    });
  }
});
