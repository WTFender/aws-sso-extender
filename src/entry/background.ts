import extension from '../extension';
import { ExtensionData, ExtensionMessage } from '../types';
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
