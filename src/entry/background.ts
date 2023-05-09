import extension from '../extension';
import { firefoxContainer } from '../utils';

extension.log('background');

extension.config.browser.webRequest.onBeforeRequest.addListener(
  firefoxContainer,
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
