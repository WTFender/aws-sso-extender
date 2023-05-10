import extension from '../extension';
import { createContainer } from '../utils';

extension.log('background');

extension.loadData().then((data) => {
  const { firefoxContainers } = extension.findUser(data).custom;
  extension.log(`firefoxContainers:${firefoxContainers}`);
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
  } else {
    /*
    extension.config.browser.storage.onChanged.addListener((changes, namespace) => {
      // TODO figure out listening for changes to custom.firefoxContainers
    });
    */
  }
});
