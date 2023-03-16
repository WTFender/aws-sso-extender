// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require('webextension-polyfill');

class Extension {
  config: ExtensionConfig;

  ssoUrl: string;

  ssoUrlRegex: RegExp;

  user: UserData;

  apps: AppData[];

  loaded: boolean;

  constructor(config: ExtensionConfig) {
    this.config = config;
    this.loaded = false;
    this.apps = [];
    this.log(this);
  }

  run() {
    // getUser > getApps > getProfiles > resolve promises > saveData
    this.log('func:run');
    this.ssoUrl = `https://portal.sso.${this.getRegion()}.amazonaws.com`;
    this.getUser().then((user) => {
      this.user = user;
      const profiles: Promise<AppProfileData | void>[] = [];

      this.getApps().then((apps) => {
        apps.forEach((app) => {
          profiles.push(
            this.getAppProfiles(app).then((appProfiles) => {
              const appWithProfiles = app;
              appWithProfiles.profiles = appProfiles;
              this.apps.push(appWithProfiles);
            }),
          );
        });
        Promise.all(profiles).then(() => {
          this.updateData();
          this.loaded = true;
        });
      });
    });
  }

  log(v) {
    if (this.config.debug) {
      if (typeof v !== 'string') {
        // eslint-disable-next-line no-console
        console.log(v);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${this.config.name}:${v}`);
      }
    }
  }

  async requestOrigins(directoryId = null) {
    const { origins } = this.config;
    if (directoryId !== null) {
      // TODO support granular directory permissions
      // origins = [`'https://${directoryId}.awsapps.com/start*'`];
    }
    browser.permissions.request({ origins });
  }

  async checkPermissions() {
    this.log('func:checkPermissions');
    const origins = browser.permissions.contains({
      origins: this.config.origins,
    });
    const history = browser.permissions.contains({
      permissions: ['history'],
    });
    const data = await Promise.all([origins, history]).then((res) => ({
      origins: res[0],
      history: res[1],
    }));
    this.log(data);
    return data;
  }

  async searchHistory() {
    const dirs = [];
    return browser.history.search({
      text: 'awsapps.com/start#/',
      startTime: (Date.now() - (1000 * 60 * 60 * 24 * 30)), // 1 month ago,
      maxResults: 1000,
    }).then((results) => {
      results?.forEach((site) => {
        const match = this.config.ssoUrlRegex.exec(site.url);
        if (match) {
          if (!(match.groups.directoryId in dirs)) {
            dirs.push(match.groups.directoryId);
          }
        }
      });
      const uniqDirs = [...new Set(dirs)];
      this.log(uniqDirs);
      return uniqDirs;
    });
  }

  getRegion() {
    const region = (
      document.head.querySelector('[name~=region][content]') as HTMLMetaElement
    ).content;
    this.log(`func:getRegion:${region}`);
    return region;
  }

  getToken() {
    const ssoKey = 'x-amz-sso_authn';
    const cookies = Object.fromEntries(
      document.cookie
        .split('; ')
        .map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
    );
    this.log(`func:getToken:${ssoKey in cookies}`);
    return cookies[ssoKey];
  }

  getUser() {
    return this.api('/user') as Promise<UserData>;
  }

  getApps() {
    return this.api('/instance/appinstances').then(
      (data) => data.result,
    ) as Promise<AppData[]>;
  }

  getAppProfiles(app: AppData) {
    return this.api(`/instance/appinstance/${app.id}/profiles`).then(
      (data) => data.result,
    ) as Promise<AppProfileData[]>;
  }

  async api(path: string) {
    this.log(`func:api:${path}`);
    return fetch(this.ssoUrl + path, {
      headers: { 'x-amz-sso_bearer_token': this.getToken() },
    }).then((response) => {
      this.log(`func:api:${path}:results`);
      return response.json();
    });
  }

  checkProfiles(appProfiles) {
    this.log(appProfiles);
    return appProfiles.map((ap) => JSON.parse(ap[Object.keys(ap)[0]]));
  }

  async loadData() {
    this.log('func:loadData');
    const customKey = `${this.config.name}-custom`;
    const customData = await chrome.storage.sync.get(customKey);
    const custom = customData[customKey] === undefined ? {} : JSON.parse(customData[customKey]);
    const userKey = `${this.config.name}-user`;
    const userData = await chrome.storage.sync.get(userKey);
    const user = userData[userKey] === undefined ? {} : JSON.parse(userData[userKey]);
    const profilesKey = `${this.config.name}-profiles`;
    const profilesData = await chrome.storage.sync.get(profilesKey);
    // eslint-disable-next-line max-len
    const profiles = profilesData[profilesKey] === undefined ? {} : JSON.parse(profilesData[profilesKey]);
    const { updatedAt } = profiles;
    const appProfiles = [];
    this.log(profiles);
    profiles?.appProfileIds?.forEach((apId) => {
      appProfiles.push(chrome.storage.sync.get(apId));
    });
    const data = await Promise.all(appProfiles).then((aps) => ({
      custom,
      user,
      updatedAt,
      appProfiles: aps.map((ap) => JSON.parse(ap[Object.keys(ap)[0]])),
    }));
    this.log(data);
    return data;
  }

  parseAppProfiles() {
    const appProfiles = [];
    this.apps.forEach((app) => {
      app.profiles.forEach((profile) => {
        const appProfile = {
          ...app,
          profile,
        };
        delete appProfile.profiles;
        /* TODO do i need this
        if (!('favorite' in appProfile)) {
          appProfile.favorite = false;
        }
        */
        appProfiles.push(appProfile);
      });
    });
    return appProfiles;
  }

  saveCustom(custom) {
    this.log('func:saveCustom');
    this.saveData(`${this.config.name}-custom`, custom);
  }

  resetData() {
    this.saveData(`${this.config.name}-user`, {});
    this.saveData(`${this.config.name}-custom`, {});
    this.saveData(`${this.config.name}-profiles`, {});
  }

  saveData(dataKey, data) {
    this.log(`func:saveData:${dataKey}`);
    const dataObj = {};
    dataObj[dataKey] = JSON.stringify(
      typeof data === 'object' ? { ...data, updatedAt: Date.now() } : data,
    );
    chrome.storage.sync.set(dataObj);
  }

  saveAppProfiles() {
    this.log('func:saveAppProfiles');
    const appProfiles = this.parseAppProfiles();
    appProfiles.forEach((appProfile) => {
      this.saveData(appProfile.profile.id, appProfile);
    });
    const appProfileIds = appProfiles.map((ap) => ap.profile.id);
    this.log(appProfileIds);
    this.saveData(`${this.config.name}-profiles`, { appProfileIds });
  }

  updateData() {
    this.log('func:updateData');
    this.saveAppProfiles();
    this.saveData(`${this.config.name}-user`, this.user);
  }
}

const extensionConfig = {
  id: 'hoibkegkkiolnikaihpdphegmbpeilfg',
  name: 'aws-sso-ext',
  display: 'AWS SSO Extender',
  debug: true,
  origins: ['https://*.awsapps.com/start*'],
  ssoUrlRegex: /^https:\/\/(?<directoryId>.+)\.awsapps\.com\/start\/?#\/$/,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const extension = new Extension(extensionConfig);

export default extension;
