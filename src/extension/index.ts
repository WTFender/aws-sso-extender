import browser from 'webextension-polyfill';
import { type ExtensionConfig } from '../types';
import Extension from './extension';

const extensionConfig: ExtensionConfig = {
  id: import.meta.env.VITE_EXT_ID,
  name: import.meta.env.VITE_EXT_SHORT_NAME,
  display: import.meta.env.VITE_EXT_NAME,
  debug: import.meta.env.VITE_EXT_DEBUG === 'true',
  build: Date.now().toString(),
  permissions: {
    console: ['https://*.console.aws.amazon.com/*'],
    signin: ['https://signin.aws.amazon.com/switchrole?*'],
    saml: ['https://signin.aws.amazon.com/saml'],
    sso: ['https://*.awsapps.com/start*'],
    containers: [
      'https://*.amazonaws.com/federation/console?*',
      'https://*.amazonaws-us-gov.com/federation/console?*',
      'https://*.amazonaws.cn/federation/console?*',
    ],
  },
  browser,
  delay: 750,
  version: browser.runtime.getManifest().version,
};

export default new Extension(extensionConfig);
