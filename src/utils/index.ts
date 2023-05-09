import extension from '../extension';

const availableContainerIcons = [
  'fingerprint',
  'briefcase',
  'dollar',
  'cart',
  'circle',
  'gift',
  'vacation',
  'food',
  'fruit',
  'pet',
  'tree',
  'chill',
  'fence',
];

const availableContainerColors = [
  'blue',
  'turquoise',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
];

let containerNameTemplate = 'name role';

function randomIcon() {
  // eslint-disable-next-line no-bitwise
  return availableContainerIcons[Math.random() * availableContainerIcons.length | 0];
}

function randomColor() {
  // eslint-disable-next-line no-bitwise
  return availableContainerColors[Math.random() * availableContainerColors.length | 0];
}

function prepareContainer({
  name, color, icon, cb,
}) {
  extension.config.browser.contextualIdentities.query({
    name,
  }).then((containers) => {
    if (containers.length >= 1) {
      cb(containers[0]);
    } else {
      extension.config.browser.contextualIdentities.create({
        name,
        color: color || randomColor(),
        icon: icon || randomIcon(),
      }).then((container) => {
        cb(container);
      });
    }
  });
}

function firefoxContainer(details) {
  extension.log('firefoxContainer');
  // If we're in a container already, skip
  if (details.cookieStoreId !== 'firefox-default') {
    return {};
  }

  // Intercept our response
  const filter = extension.config.browser.webRequest.filterResponseData(details.requestId);

  // Parse some params for container name
  const accountRole = details.url.split('=')[2];
  // account is account ID and account name in parens
  const account = decodeURIComponent(details.originUrl.split('/')[7]);
  const accountName = account.split('(')[1].slice(0, -1);
  const accountNumber = account.split(' ')[0];

  const params = {
    name: accountName,
    number: accountNumber,
    role: accountRole,
  };

  let name = containerNameTemplate;

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(params)) {
    name = name.replace(key, value);
  }

  let str = '';
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();

  filter.ondata = (event) => {
    str += decoder.decode(event.data, { stream: true });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filter.onstop = (event) => {
    // The first OPTIONS request has no response body
    if (str.length > 0) {
      // signInToken
      // signInFederationLocation
      // destination
      const object = JSON.parse(str);

      // If we have a sign-in token, hijack this into a container
      if (object.signInToken) {
        let { destination } = object;
        if (!destination) {
          destination = 'https://console.aws.amazon.com';
        }

        // Generate our federation URI and open it in a container
        const url = `${object.signInFederationLocation}?Action=login&SigninToken=${object.signInToken}&Issuer=${encodeURIComponent(details.originUrl)}&Destination=${encodeURIComponent(destination)}`;
        prepareContainer({
          name,
          cb(container) {
            const createTabParams = {
              cookieStoreId: container.cookieStoreId,
              url,
              pinned: false,
            };

            extension.config.browser.tabs.create(createTabParams);
            extension.config.browser.tabs.remove(details.tabId);
          },
        });
      } else {
        filter.write(encoder.encode(str));
      }
    }
    filter.close();
  };

  return {};
}

containerNameTemplate = 'name role';

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

export { waitForElement, firefoxContainer };
