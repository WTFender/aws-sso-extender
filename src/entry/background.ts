import extension from '../extension';
import { createContainer } from '../utils';

extension.log('background');

extension.config.browser.contextualIdentities.query({}).then((details) => {
  // TODO figure out why i cant see this
  details.forEach((detail) => {
    extension.log(detail);
  });
});

function listenConsole() {
  extension.loadData().then((data) => {
    const { firefoxContainers } = extension.findUser(data).custom;
    extension.log(`background:firefoxContainers:${firefoxContainers}`);
    if (firefoxContainers) {
      extension.config.browser.webRequest.onBeforeRequest.addListener(
        createContainer,
        {
          urls: [
            'https://*.amazonaws.com/federation/console?*',
            'https://*.amazonaws-us-gov.com/federation/console?*',
            'https://*.amazonaws.cn/federation/console?*',
          ],
          types: ['xmlhttprequest'],
        },
        ['blocking'],
      );
    }
  });
}

extension.checkPermissions().then((permissions) => {
  extension.log(permissions);
  if (permissions.containers) {
    listenConsole();
  } else {
    extension.config.browser.storage.onChanged.addListener(listenConsole);
  }
});
