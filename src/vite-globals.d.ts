import { type Browser } from 'webextension-polyfill';
import { type Extension } from './extension';

// define types for global variables

declare module '@vue/runtime-core' {
  // eslint-disable-next-line no-unused-vars
  interface ComponentCustomProperties {
    $browser: Browser
    $ext: Extension
  }
}

export { };
