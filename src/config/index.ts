const extensionConfig: ExtensionConfig = {
  id: 'hoibkegkkiolnikaihpdphegmbpeilfg',
  name: 'aws-sso-ext',
  display: 'AWS SSO Extender',
  debug: false,
  origins: ['https://*.awsapps.com/start*'],
  ssoUrlRegex: /^https:\/\/(?<directoryId>.{1,64})\.awsapps\.com\/start\/?#?\/?$/,
};

if (process.env.NODE_ENV === 'development') {
  extensionConfig.debug = true;
}

export default extensionConfig;
