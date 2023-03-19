// eslint-disable-next-line @typescript-eslint/no-var-requires
const browser = require('webextension-polyfill');

class Extension {
  config: ExtensionConfig;

  ssoUrl: string;

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
              appWithProfiles.userId = this.user.userId;
              appWithProfiles.profiles = appProfiles;
              this.apps.push(appWithProfiles);
            }),
          );
        });
        Promise.all(profiles).then(() => {
          this.update();
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

  async loadUser(userId): Promise<UserData> {
    const userKey = `${this.config.name}-user-${userId}`;
    const userData = await browser.storage.sync.get(userKey);
    const user = userData[userKey] === undefined ? {} : JSON.parse(userData[userKey]);
    const customKey = `${this.config.name}-custom-${userId}`;
    const customData = await browser.storage.sync.get(customKey);
    const custom = customData[customKey] === undefined ? {} : JSON.parse(customData[customKey]);
    user.custom = custom;
    return user;
  }

  async loadUsers(): Promise<Array<UserData>> {
    const users = [];
    const usersKey = `${this.config.name}-users`;
    const usersData = await browser.storage.sync.get(usersKey);
    const userIds = usersData[usersKey] === undefined ? [] : JSON.parse(usersData[usersKey]).users;
    userIds.forEach((userId) => {
      users.push(this.loadUser(userId));
    });
    await Promise.all(users);
    const data = await Promise.all(users).then((x) => (x));
    return data;
  }

  saveSettings(settings) {
    this.saveData(`${this.config.name}-settings`, settings);
  }

  async loadSettings() {
    const defaultSettings = {
      defaultUser: 'lastUserId',
      lastUserId: null,
    };
    const setKey = `${this.config.name}-settings`;
    const setData = await browser.storage.sync.get(setKey);
    const settings = setData[setKey] === undefined ? defaultSettings : JSON.parse(setData[setKey]);
    return settings;
  }

  async loadData() {
    this.log('func:loadData');
    const settings = await this.loadSettings();
    const users = await this.loadUsers();
    const appProfileIds = users.map((user) => user.appProfileIds);
    const uniqProfileIds = [...new Set(appProfileIds.flat(1))];
    const appProfiles = [];
    uniqProfileIds.forEach((apId) => {
      appProfiles.push(browser.storage.sync.get(apId));
    });
    const data = await Promise.all(appProfiles).then((aps) => ({
      settings,
      users,
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
        appProfiles.push(appProfile);
      });
    });
    return appProfiles;
  }

  resetData() {
    this.log('func:resetData');
    return browser.storage.sync.clear();
  }

  saveData(dataKey, data) {
    this.log(`func:saveData:${dataKey}`);
    const dataObj = {};
    dataObj[dataKey] = JSON.stringify(
      typeof data === 'object' ? { ...data, updatedAt: Date.now() } : data,
    );
    browser.storage.sync.set(dataObj);
  }

  saveUser(user) {
    if ('custom' in user) {
      this.saveData(`${this.config.name}-custom-${user.userId}`, user.custom);
      const userData = user;
      delete userData.custom;
      this.saveData(`${this.config.name}-user-${user.userId}`, userData);
    } else {
      this.saveData(`${this.config.name}-user-${user.userId}`, user);
    }
  }

  saveAppProfiles() {
    this.log('func:saveAppProfiles');
    const appProfiles = this.parseAppProfiles();
    appProfiles.forEach((appProfile) => {
      this.saveData(appProfile.profile.id, appProfile);
    });
    const appProfileIds = appProfiles.map((ap) => ap.profile.id);
    const data = { ...this.user, appProfileIds };
    this.saveUser(data);
  }

  async update() {
    this.log('func:updateData');
    this.loadData().then((data) => {
      const userIds = [this.user.userId, ...data.users.map((user) => user.userId)];
      this.saveData(`${this.config.name}-users`, { users: [...new Set(userIds)] });
      this.saveAppProfiles();
    });
  }
}

const extensionConfig = {
  id: 'hoibkegkkiolnikaihpdphegmbpeilfg',
  name: 'aws-sso-ext',
  display: 'AWS SSO Extender',
  debug: true,
  origins: ['https://*.awsapps.com/start*'],
  ssoUrlRegex: /^https:\/\/(?<directoryId>.{1,64})\.awsapps\.com\/start\/?#?\/?$/,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const extension = new Extension(extensionConfig);

export default extension;
