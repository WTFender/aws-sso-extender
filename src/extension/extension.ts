import {
  type ExtensionConfig,
  type UserData,
  type AppData,
  type ExtensionData,
  type ExtensionSettings,
  type IamRole,
  CustomData,
} from '../types';

function encodeUriPlusParens(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
}

class Extension {
  config: ExtensionConfig;

  platform: 'chrome' | 'firefox';

  ssoUrlRegex: RegExp;

  ssoUrl: string;

  apps: AppData[];

  loaded: boolean;

  defaultCustom = {
    sessionLabelSso: '{{user}}/{{profile}} @ {{account}}',
    sessionLabelIam: '{{user}}/{{role}} @ {{account}} via {{profile}}',
    colorDefault: '222f3e',
    colorFooter: true, // confusing if these are disabled
    colorHeader: true, // after granting permissions
    labelFooter: true,
    labelHeader: true,
    profiles: {},
  };

  defaultSettings = {
    defaultUser: 'lastUserId',
    lastUserId: null,
    lastProfileId: null,
  };

  constructor(config: ExtensionConfig) {
    this.config = config;
    this.platform = navigator.userAgent.indexOf('Firefox') !== -1 ? 'firefox' : 'chrome';
    this.ssoUrlRegex = /^https:\/\/(?<directoryId>.{1,64})\.awsapps\.com\/start\/?#?\/?$/;
    this.ssoUrl = '';
    this.loaded = false;
    this.apps = [];
    this.log(this);
  }

  log(v: unknown): void {
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

  buildLabel(s, user, profile, role, account, accountName) {
    let label = s;
    if (user) { label = label.replaceAll('{{user}}', user); }
    if (role) { label = label.replaceAll('{{role}}', role); }
    if (profile) { label = label.replaceAll('{{profile}}', profile); }
    if (account) { label = label.replaceAll('{{account}}', account); }
    if (accountName) { label = label.replaceAll('{{accountName}}', accountName); }
    this.log(`func:buildLabel:${label}`);
    return label;
  }

  getCookie(name) {
    const cookies = Object.fromEntries(
      document.cookie
        .split('; ')
        .map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
    );
    this.log(`func:getCookie:${name in cookies}`);
    return cookies[name];
  }

  resetPermissions() {
    this.config.browser.permissions.remove({
      permissions: ['history'],
      origins: [
        ...this.config.permissions.sso,
        ...this.config.permissions.console,
        ...this.config.permissions.signin,
      ],
    });
  }

  async checkPermissions(): Promise<object> {
    this.log('func:checkPermissions');
    const history = this.config.browser.permissions.contains({
      permissions: ['history'],
    });
    const console = this.config.browser.permissions.contains({
      origins: this.config.permissions.console,
    });
    const signin = this.config.browser.permissions.contains({
      origins: this.config.permissions.signin,
    });
    const sso = this.config.browser.permissions.contains({
      origins: this.config.permissions.sso,
    });
    const data = await Promise.all([history, console, signin, sso]).then((res) => ({
      history: res[0],
      console: res[1],
      signin: res[2],
      sso: res[3],
    }));
    this.log(data);
    return data;
  }

  async searchHistory(): Promise<string[]> {
    const dirs: string[] = [];
    return this.config.browser.history.search({
      text: 'awsapps.com/start#/',
      startTime: (Date.now() - (1000 * 60 * 60 * 24 * 30)), // 1 month ago,
      maxResults: 1000,
    }).then((results) => {
      results?.forEach((site) => {
        const match = this.ssoUrlRegex.exec(site.url as string);
        if (match?.groups != null) {
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

  checkProfiles(appProfiles: AppData[]): AppData[] {
    this.log(appProfiles);
    return appProfiles.map((ap) => JSON.parse(ap[Object.keys(ap)[0]]));
  }

  /*
  static calculateChecksum(c) {
    // generate csrf token
    let a = 1;
    let b = 0;
    if (!c) { return 0; }
    for (let i = 0; i < c.length; ++i) {
      a = (a + c.charCodeAt(i)) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 15) | a;
  }
  */

  async loadIamLogins(): Promise<IamRole[]> {
    const loginsKey = `${this.config.name}-iam-logins`;
    const loginsData = await this.config.db.get(loginsKey);
    const logins = loginsData[loginsKey] === undefined ? {} : JSON.parse(loginsData[loginsKey]);
    return logins;
  }

  async removeIamLogin(profileId: string): Promise<void> {
    this.log(`func:removeIamLogin:${profileId}`);
    const logins = await this.loadIamLogins();
    delete logins[profileId];
    this.log(logins);
    return this.saveData(`${this.config.name}-iam-logins`, logins);
  }

  queueIamLogin(role: IamRole): Promise<void> {
    this.log('func:queueIamLogin');
    return this.loadIamLogins().then((logins) => {
      const iamLogins = logins;
      iamLogins[role.profileId] = role;
      this.saveData(`${this.config.name}-iam-logins`, iamLogins);
    });
  }

  async loadUser(userId: string): Promise<UserData> {
    const userKey = `${this.config.name}-user-${userId}`;
    const userData = await this.config.db.get(userKey);
    const user = userData[userKey] === undefined ? {} : JSON.parse(userData[userKey]);
    const customKey = `${this.config.name}-custom-${userId}`;
    const customData = await this.config.db.get(customKey);
    // eslint-disable-next-line vue/max-len
    const custom = customData[customKey] === undefined ? this.defaultCustom : JSON.parse(customData[customKey]);
    user.custom = custom;
    return user as UserData;
  }

  async loadUsers(): Promise<UserData[]> {
    const users: Array<Promise<UserData>> = [];
    const usersKey = `${this.config.name}-users`;
    const usersData = await this.config.db.get(usersKey);
    const userIds = usersData[usersKey] === undefined ? [] : JSON.parse(usersData[usersKey]).users;
    userIds.forEach((userId: string) => {
      users.push(this.loadUser(userId));
    });
    await Promise.all(users);
    const data = await Promise.all(users).then((x) => (x));
    return data;
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await this.saveData(`${this.config.name}-settings`, settings);
  }

  async loadSettings(): Promise<ExtensionSettings> {
    const setKey = `${this.config.name}-settings`;
    const setData = await this.config.db.get(setKey);
    // eslint-disable-next-line vue/max-len
    const settings = setData[setKey] === undefined ? this.defaultSettings : JSON.parse(setData[setKey]);
    return settings as ExtensionSettings;
  }

  getDefaultUser(data: ExtensionData): UserData {
    this.log('func:getDefaultUser');
    if (data.settings.defaultUser === 'lastUserId') {
      return data.users[0];
    }
    return data.users.filter((u) => u.userId === data.settings.defaultUser)[0];
  }

  async loadData(): Promise<ExtensionData> {
    this.log('func:loadData');
    const iamLogins = await this.loadIamLogins();
    const settings = await this.loadSettings();
    let users = await this.loadUsers();
    users = users.sort((a, b) => ((a.updatedAt > b.updatedAt) ? -1 : 1));
    const appProfileIds = users.map((u) => u.appProfileIds);
    const uniqProfileIds = [...new Set(appProfileIds.flat(1))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appProfiles: Array<Promise<Record<string, any>>> = [];
    uniqProfileIds.forEach((apId) => {
      appProfiles.push(this.config.db.get(apId));
    });
    const data = await Promise.all(appProfiles).then((aps) => ({
      updatedAt: users.length > 0 ? users[0].updatedAt : 0,
      appProfiles: aps.map((ap) => JSON.parse(ap[Object.keys(ap)[0]])),
      settings,
      users,
      iamLogins,
    }));
    this.log(data);
    return data;
  }

  createProfileUrl(user: UserData, appProfile: AppData) {
    this.log('func:createProfileUrl');
    const ssoDirUrl = `https://${user.managedActiveDirectoryId}.awsapps.com/start/#/saml/custom`;
    const appProfilePath = encodeUriPlusParens(btoa(`${user.accountId}_${appProfile.id}_${appProfile.profile.id}`));
    const appProfileName = encodeUriPlusParens(appProfile.name);
    return `${ssoDirUrl}/${appProfileName}/${appProfilePath}`;
  }

  parseAppProfiles(): AppData[] {
    const appProfiles: AppData[] = [];
    this.apps.forEach((app) => {
      app.profiles?.forEach((profile) => {
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

  async resetData(): Promise<void> {
    this.log('func:resetData');
    await this.config.db.clear();
  }

  async saveData(dataKey: string, data: unknown): Promise<void> {
    this.log(`func:saveData:${dataKey}`);
    this.log(data);
    const dataObj = {};
    dataObj[dataKey] = JSON.stringify(
      typeof data === 'object' ? { ...data, updatedAt: Date.now() } : data,
    );
    await this.config.db.set(dataObj);
  }

  saveUser(user: UserData): Promise<void> {
    if ('custom' in user) {
      this.saveData(`${this.config.name}-custom-${user.userId}`, user.custom);
    }
    return this.saveData(`${this.config.name}-user-${user.userId}`, { ...user, custom: {} });
  }

  saveAppProfiles(user: UserData): void {
    this.log('func:saveAppProfiles');
    const appProfiles = this.parseAppProfiles();
    appProfiles.forEach((appProfile) => {
      this.saveData(appProfile.profile?.id, appProfile);
    });
    const appProfileIds = appProfiles.map((ap) => ap.profile?.id);
    const data = { ...user, appProfileIds };
    this.saveUser(data);
  }

  customizeProfiles(user: UserData, appProfiles: AppData[]): AppData[] {
    this.log('func:customizeProfiles');
    const defaults: CustomData = {
      color: this.defaultCustom.colorDefault,
      favorite: false,
      label: null,
      iamRoles: [] as IamRole[],
    };
    const customProfiles: AppData[] = [];
    appProfiles.forEach((ap) => {
      const profile = ap;
      // eslint-disable-next-line max-len, vue/max-len
      profile.profile.custom = ap.profile.id in user.custom.profiles ? user.custom.profiles[ap.profile.id] : defaults;
      customProfiles.push(profile);
    });
    this.log(user);
    this.log(customProfiles);
    return customProfiles;
  }

  async update(user: UserData): Promise<void> {
    this.log('func:updateData');
    await this.loadData().then((data) => {
      const userIds = [user.userId, ...data.users.map((u) => u.userId)];
      this.saveData(`${this.config.name}-users`, { users: [...new Set(userIds)] });
      this.saveAppProfiles(user);
    });
  }

  switchRole(role: IamRole) {
    const roleArgs = [
      `${this.config.name}=true`, // identify when this extension is switching roles
      `displayName=${role.label}`,
      `roleName=${role.roleName}`,
      `account=${role.accountId}`,
      `color=${role.color}`,
      'action=switchFromBasis',
      'mfaNeeded=0',
      'src=nav',
      `redirect_uri=${encodeURIComponent('https://console.aws.amazon.com/console/home')}`,
    ].join('&');
    window.location.href = `https://signin.aws.amazon.com/switchrole?${roleArgs}`;
  }
}

export default Extension;
