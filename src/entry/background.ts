import extension from '../extension';
import { createContainer } from '../utils';

extension.log('background');

/*
function handleMessage(request, sender, sendResponse) {
  extension.log('background:handleMessage');
  extension.log(`${request} ${sender}`);
  // sendResponse({ response: 'responseText' });
}
*/

function listenConsole() {
  if (!extension.config.browser.webRequest.onBeforeRequest.hasListener(createContainer)) {
    extension.log('background:listenConsole');
    extension.config.browser.webRequest.onBeforeRequest.addListener(
      createContainer,
      {
        urls: [
          'https://signin.aws.amazon.com/switchrole?*',
          'https://*.amazonaws.com/federation/console?*',
          'https://*.amazonaws-us-gov.com/federation/console?*',
          'https://*.amazonaws.cn/federation/console?*',
        ],
        types: ['xmlhttprequest'],
      },
      ['blocking'],
    );
  } else { extension.log('background:listenConsole:listeners exist'); }
}

function setupContainer() {
  extension.log('background:setupContainer');
  // check container permissions
  extension.checkPermissions().then((permissions) => {
    extension.log(permissions);
    if (permissions.containers) {
      extension.loadData().then((data) => {
        // check user container setting
        const { firefoxContainers } = extension.findUser(data).custom;
        extension.log(`background:firefoxContainers:${firefoxContainers}`);
        if (firefoxContainers) {
          listenConsole();
        }
      });
    }
  });
}

// extension.config.browser.runtime.onMessage.addListener(handleMessage);
extension.config.browser.permissions.onAdded.addListener(setupContainer);
extension.config.browser.storage.onChanged.addListener((changes) => {
  const changeKeys = Object.keys(changes);
  changeKeys.forEach((k) => {
    if (k.startsWith(`${extension.config.name}-custom-`)) {
      // user changes
      if (changes[k].newValue.firefoxContainers) {
        setupContainer();
      } else {
        extension.config.browser.webRequest.onBeforeRequest.removeListener(createContainer);
      }
    }
  });
});
setupContainer();
