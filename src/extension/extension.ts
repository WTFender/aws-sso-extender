import {
  type ExtensionConfig,
  type UserData,
  type AppData,
  type ExtensionData,
  type ExtensionSettings,
  type IamRole,
} from '../types';

function encodeUriPlusParens(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
}

class Extension {
  config: ExtensionConfig;

  ssoUrlRegex: RegExp;

  ssoUrl: string;

  apps: AppData[];

  loaded: boolean;

  constructor(config: ExtensionConfig) {
    this.config = config;
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

  buildRoleLabel(role: IamRole, ap: AppData): string {
    let label = role.label.replaceAll('{{account}}', role.accountId);
    label = label.replaceAll('{{role}}', role.roleName);
    label = label.replaceAll('{{profile}}', ap.profile.custom!.label ? ap.profile.custom!.label : ap.profile.name);
    this.log(label);
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

  async checkPermissions(): Promise<object> {
    this.log('func:checkPermissions');
    const origins = this.config.browser.permissions.contains({
      origins: this.config.origins,
    });
    const history = this.config.browser.permissions.contains({
      permissions: ['history'],
    });
    const data = await Promise.all([origins, history]).then((res) => ({
      origins: res[0],
      history: res[1],
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

  static calculateChecksum(c) {
    let a = 1;
    let b = 0;
    if (!c) { return 0; }
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < c.length; ++i) {
      a = (a + c.charCodeAt(i)) % 65521;
      b = (b + a) % 65521;
    }
    // eslint-disable-next-line no-bitwise
    return (b << 15) | a;
  }

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
    const custom = customData[customKey] === undefined ? {} : JSON.parse(customData[customKey]);
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
    const defaultSettings = {
      defaultUser: 'lastUserId',
      lastUserId: null,
    };
    const setKey = `${this.config.name}-settings`;
    const setData = await this.config.db.get(setKey);
    const settings = setData[setKey] === undefined ? defaultSettings : JSON.parse(setData[setKey]);
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
    const { userId } = user;
    if ('custom' in user) {
      this.saveData(`${this.config.name}-custom-${userId}`, user.custom);
      const userData = user;
      userData.custom = {};
      return this.saveData(`${this.config.name}-user-${userId}`, userData);
    }
    return this.saveData(`${this.config.name}-user-${userId}`, user);
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
    const defaults = {
      favorite: false,
      label: null,
      iamRoles: [],
    };
    const customProfiles: AppData[] = [];
    appProfiles.forEach((ap) => {
      const profile = ap;
      // eslint-disable-next-line max-len
      profile.profile.custom = ap.profile.id in user.custom ? user.custom[ap.profile.id] : defaults;
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
    const csrfToken = Extension.calculateChecksum(this.getCookie('aws-userInfo'));
    const roleArgs = [
      `displayName=${role.label}`,
      `roleName=${role.roleName}`,
      `account=${role.accountId}`,
      `color=${role.color}`,
      `csrf=${csrfToken}`,
      'action=switchFromBasis',
      'mfaNeeded=0',
      'src=nav',
      `redirect_uri=${encodeURIComponent('https://console.aws.amazon.com/console/home')}`,
    ].join('&');
    window.open(`https://signin.aws.amazon.com/switchrole?${roleArgs}`, '_self');
    /*
    return fetch('https://signin.aws.amazon.com/switchrole', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: roleArgs,
    }).then((response) => response.url);
    */
  }
}

export default Extension;
