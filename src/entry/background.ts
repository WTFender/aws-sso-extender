import extension from '../extension';
import { ExtensionData, ExtensionMessage, ExtensionSettings } from '../types';
import { createFirefoxContainer } from '../utils';

extension.log('background:init');

// setup listeners to create firefox containers
function listenConsole() {
  if (!extension.config.browser.webRequest.onBeforeRequest.hasListener(createFirefoxContainer)) {
    extension.log('background:listenConsole');
    extension.config.browser.webRequest.onBeforeRequest.addListener(
      createFirefoxContainer,
      {
        urls: [
          ...extension.config.permissions.containers,
          ...extension.config.permissions.signin,
        ],
        types: ['xmlhttprequest'],
      },
      ['blocking'],
    );
  } else { extension.log('background:listenConsole:listenerExists'); }
}

// listen for hotkey commands
extension.config.browser.commands.onCommand.addListener((command) => {
  extension.log(`background:command:${command}`);
  // message popup to open profile
  if (command.startsWith('openProfile')) {
    extension.loadData().then((data: ExtensionData) => {
      extension.log(data);
      const appProfileId = data.users[0].custom.hotkeys[command];
      extension.log(`background:command:appProfileId:${appProfileId}`);
      const appProfiles = extension.customizeProfiles(data.users[0], data.appProfiles);
      const appProfile = extension.findAppProfileById(appProfileId, appProfiles);
      extension.log(appProfile);
      extension.navSelectedProfile(appProfile, data.users[0], data.users, data.settings);
    });
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
  extension.config.browser.runtime.onMessage.addListener((msg: ExtensionMessage) => {
    extension.checkPermissions().then((permissions) => {
      if (msg.action === 'enableFirefoxContainers') {
        extension.log('background:enableFirefoxContainers');
        if (permissions.containers) {
          listenConsole();
        }
      } else if (msg.action === 'disableFirefoxContainers') {
        extension.log('background:disableFirefoxContainers');
        if (permissions.containers) {
          // eslint-disable-next-line vue/max-len
          extension.config.browser.webRequest.onBeforeRequest.removeListener(createFirefoxContainer);
        }
      }
    });
  });

  // startup listeners
  extension.checkPermissions().then((permissions) => {
  // permissions
    if (permissions.containers) {
      extension.loadData().then((data: ExtensionData) => {
      // settings
        if (data.settings.firefoxContainers) {
          listenConsole();
        }
      });
    }
  });
}
