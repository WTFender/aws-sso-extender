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
              appWithProfiles.profiles = appProfiles;
              this.apps.push(appWithProfiles);
            }),
          );
        });
        Promise.all(profiles).then(() => {
          this.saveData();
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

  async loadData() {
    this.log('func:loadData');
    const dataKey = this.config.name;
    const data = await chrome.storage.sync.get(dataKey);
    return JSON.parse(data[dataKey]);
  }

  saveData() {
    this.log('func:saveData');
    const data = {};
    data[this.config.name] = JSON.stringify({
      user: this.user,
      apps: this.apps,
      updatedAt: Date.now(),
    });
    this.log(data);
    chrome.storage.sync.set(data);
  }

  menu() {
    this.log('menu class loaded');
    this.log(window.location);
  }
}

const extensionConfig = {
  name: 'aws-sso-qs',
  debug: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const extension = new Extension(extensionConfig);

export default extension;
