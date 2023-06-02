import extension from '../extension';
import { createFirefoxContainer } from './container';

function waitForElement<TElement extends Element = HTMLElement>(
  selector: string,
  options: {
    timeout?: number;
    parentNode?: ParentNode;
  } = {},
): Promise<TElement> {
  extension.log(`waitForElement:${selector}`);
  const { timeout = 3000, parentNode = document } = options;

  return new Promise((resolve, reject) => {
    const element = parentNode.querySelector<TElement>(selector);

    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.from(mutation.addedNodes).forEach((addedNode) => {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const targetElement = (addedNode as Element).querySelector<TElement>(selector);

            if (targetElement) {
              observer.disconnect();
              resolve(targetElement);
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element not found with selector "${selector}"`));
    }, timeout);
  });
}

// TODO cleanup after 1.5.0 release
async function migrateData143() {
  let users = await extension.loadUsers();
  users = users.sort((a, b) => ((a.updatedAt > b.updatedAt) ? -1 : 1));
  const appProfileIds = users.map((u) => u.appProfileIds);
  const uniqProfileIds = [...new Set(appProfileIds.flat(1))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appProfiles: Array<Promise<Record<string, any>>> = [];
  uniqProfileIds.forEach((apId) => {
    appProfiles.push(extension.config.browser.storage.sync.get(apId));
  });
  Promise.all(appProfiles).then((aps) => {
    const parsed = aps.map((ap) => JSON.parse(ap[Object.keys(ap)[0]]));
    parsed.forEach((appProfile) => {
      // eslint-disable-next-line vue/max-len
      extension.saveData(appProfile.profile?.id, appProfile, extension.config.browser.storage.local);
    });
    const removed = extension.config.browser.storage.sync.remove(uniqProfileIds);
    removed.then(() => { extension.log('migrateData143:removed'); });
  });
}

export { waitForElement, createFirefoxContainer, migrateData143 };
