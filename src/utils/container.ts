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

function randomIcon() {
  // eslint-disable-next-line no-bitwise
  return availableContainerIcons[Math.random() * availableContainerIcons.length | 0];
}

function randomColor() {
  // eslint-disable-next-line no-bitwise
  return availableContainerColors[Math.random() * availableContainerColors.length | 0];
}

// eslint-disable-next-line func-names
export default async function (details) {
  extension.log('container');
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
  // load extension data
  const data = await extension.loadData();
  const ap = await extension.findAppProfile(accountRole, accountNumber, data);
  const user = extension.findUser(data);
  // build container label
  const label = extension.buildLabel(
    user.custom.sessionLabelSso,
    user!.subject,
    ap?.profile.custom?.label || ap?.profile.name,
    accountRole,
    accountName,
    accountNumber,
  );
  extension.log(label);

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const url = `${object.signInFederationLocation}?Action=login&SigninToken=${object.signInToken}&Issuer=${encodeURIComponent(details.originUrl)}&Destination=${encodeURIComponent(destination)}`;
        extension.config.browser.contextualIdentities.create({
          name: label,
          color: randomColor(),
          icon: randomIcon(),
        }).then((container) => {
          const createTabParams = {
            cookieStoreId: container.cookieStoreId,
            url,
            pinned: false,
          };
          extension.config.browser.tabs.create(createTabParams);
          extension.config.browser.tabs.remove(details.tabId);
        });
      } else {
        filter.write(encoder.encode(str));
      }
    }
    filter.close();
  };

  return {};
}
