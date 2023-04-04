import browser from 'webextension-polyfill';
import { type ExtensionConfig } from '../types';
import Extension from './extension';

const extensionConfig: ExtensionConfig = {
  id: import.meta.env.VITE_EXT_ID,
  name: import.meta.env.VITE_EXT_SHORT_NAME,
  display: import.meta.env.VITE_EXT_NAME,
  debug: import.meta.env.VITE_EXT_DEBUG === 'true',
  permissions: {
    console: ['https://*.console.aws.amazon.com/console/home?region*'],
    signin: ['https://signin.aws.amazon.com/switchrole?*'],
    sso: ['https://*.awsapps.com/start*'],
  },
  browser,
  db: import.meta.env.VITE_EXT_DEBUG === 'true' ? browser.storage.local : browser.storage.sync,
  delay: 750,
};

export default new Extension(extensionConfig);
