import browser from 'webextension-polyfill'
import { type ExtensionConfig, type UserData, type AppData, type ProfileData, type ExtensionData, type ApiData, type ExtensionSettings } from '../types'

class Extension {
  config: ExtensionConfig

  ssoUrlRegex: RegExp

  ssoUrl: string

  apps: AppData[]

  loaded: boolean

  constructor (config: ExtensionConfig) {
    this.config = config
    this.ssoUrlRegex = /^https:\/\/(?<directoryId>.{1,64})\.awsapps\.com\/start\/?#?\/?$/
    this.ssoUrl = ''
    this.loaded = false
    this.apps = []
    this.log(this)
  }

  run (): void {
    // getUser > getApps > getProfiles > resolve promises > saveData
    this.log('func:run')
    this.ssoUrl = `https://portal.sso.${this.getRegion()}.amazonaws.com`
    void this.getUserData().then((user) => {
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      const profiles: Array<Promise<ProfileData | void>> = []
      void this.getApps().then((apps) => {
        apps.forEach((app) => {
          profiles.push(
            this.getAppProfiles(app).then((appProfiles) => {
              const appWithProfiles = app
              appWithProfiles.profiles = appProfiles
              this.apps.push(appWithProfiles)
            })
          )
        })
        void Promise.all(profiles).then(() => {
          void this.update(user)
          this.loaded = true
        })
      })
    })
  }

  log (v: unknown): void {
    if (this.config.debug) {
      if (typeof v !== 'string') {
        // eslint-disable-next-line no-console
        console.log(v)
      } else {
        // eslint-disable-next-line no-console
        console.log(`${this.config.name}:${v}`)
      }
    }
  }

  async checkPermissions (): Promise<object> {
    this.log('func:checkPermissions')
    const origins = browser.permissions.contains({
      origins: this.config.origins
    })
    const history = browser.permissions.contains({
      permissions: ['history']
    })
    const data = await Promise.all([origins, history]).then((res) => ({
      origins: res[0],
      history: res[1]
    }))
    this.log(data)
    return data
  }

  async searchHistory (): Promise<string[]> {
    const dirs: string[] = []
    return await browser.history.search({
      text: 'awsapps.com/start#/',
      startTime: (Date.now() - (1000 * 60 * 60 * 24 * 30)), // 1 month ago,
      maxResults: 1000
    }).then((results) => {
      results?.forEach((site) => {
        const match = this.ssoUrlRegex.exec(site.url as string)
        if (match?.groups != null) {
          if (!(match.groups.directoryId in dirs)) {
            dirs.push(match.groups.directoryId)
          }
        }
      })
      const uniqDirs = [...new Set(dirs)]
      this.log(uniqDirs)
      return uniqDirs
    })
  }

  getRegion (): string {
    const region = (
      document.head.querySelector('[name~=region][content]') as HTMLMetaElement
    ).content
    this.log(`func:getRegion:${region}`)
    return region
  }

  getToken (): string {
    const ssoKey = 'x-amz-sso_authn'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cookies = Object.fromEntries(
      document.cookie
        .split('; ')
        .map((v) => v.split(/=(.*)/s).map(decodeURIComponent))
    )
    this.log('func:getToken')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return cookies[ssoKey]
  }

  async getUserData (): Promise<UserData> {
    return await (this.api('/user') as unknown as Promise<UserData>)
  }

  async getApps (): Promise<AppData[]> {
    return await (this.api('/instance/appinstances').then(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      (data) => data.result
    ) as Promise<AppData[]>)
  }

  async getAppProfiles (app: AppData): Promise<ProfileData[]> {
    return await (this.api(`/instance/appinstance/${app.id}/profiles`).then(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      (data) => data.result
    ) as Promise<ProfileData[]>)
  }

  async api (path: string): Promise<ApiData> {
    this.log(`func:api:${path}`)
    return await fetch(`${this.ssoUrl}${path}`, {
      headers: { 'x-amz-sso_bearer_token': this.getToken() }
    }).then(async (response) => {
      this.log(`func:api:${path}:results`)
      return await response.json() as ApiData
    })
  }

  checkProfiles (appProfiles: AppData[]): AppData[] {
    this.log(appProfiles)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
    return appProfiles.map((ap) => JSON.parse(ap[Object.keys(ap)[0]]))
  }

  async loadUser (userId: string): Promise<UserData> {
    const userKey = `${this.config.name}-user-${userId}`
    const userData = await browser.storage.sync.get(userKey)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const user = userData[userKey] === undefined ? {} : JSON.parse(userData[userKey])
    const customKey = `${this.config.name}-custom-${userId}`
    const customData = await browser.storage.sync.get(customKey)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const custom = customData[customKey] === undefined ? {} : JSON.parse(customData[customKey])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    user.custom = custom
    return user as UserData
  }

  async loadUsers (): Promise<UserData[]> {
    const users: Array<Promise<UserData>> = []
    const usersKey = `${this.config.name}-users`
    const usersData = await browser.storage.sync.get(usersKey)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const userIds = usersData[usersKey] === undefined ? [] : JSON.parse(usersData[usersKey]).users
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    userIds.forEach((userId: string) => {
      users.push(this.loadUser(userId))
    })
    await Promise.all(users)
    const data = await Promise.all(users).then((x) => (x))
    return data
  }

  async saveSettings (settings: ExtensionSettings): Promise<void> {
    await this.saveData(`${this.config.name}-settings`, settings)
  }

  async loadSettings (): Promise<ExtensionSettings> {
    const defaultSettings = {
      defaultUser: 'lastUserId',
      lastUserId: null
    }
    const setKey = `${this.config.name}-settings`
    const setData = await browser.storage.sync.get(setKey)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
    const settings = setData[setKey] === undefined ? defaultSettings : JSON.parse(setData[setKey])
    return settings as ExtensionSettings
  }

  getDefaultUser (data: ExtensionData): UserData {
    if (data.settings.defaultUser === 'lastUserId') {
      return data.users[0]
    }
    return data.users.filter((u) => u.userId === data.settings.defaultUser)[0]
  }

  async loadData (): Promise<ExtensionData> {
    this.log('func:loadData')
    const settings = await this.loadSettings()
    let users = await this.loadUsers()
    users = users.sort((a, b) => ((a.updatedAt > b.updatedAt) ? -1 : 1))
    const appProfileIds = users.map((user) => user.appProfileIds)
    const uniqProfileIds = [...new Set(appProfileIds.flat(1))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appProfiles: Array<Promise<Record<string, any>>> = []
    uniqProfileIds.forEach((apId) => {
      appProfiles.push(browser.storage.sync.get(apId))
    })
    const data = await Promise.all(appProfiles).then((aps) => ({
      updatedAt: users.length > 0 ? users[0].updatedAt : 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
      appProfiles: aps.map((ap) => JSON.parse(ap[Object.keys(ap)[0]])),
      settings,
      users
    }))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    data.appProfiles = this.customizeProfiles(this.getDefaultUser(data), data.appProfiles)
    this.log(data)
    return data
  }

  parseAppProfiles (): AppData[] {
    const appProfiles: AppData[] = []
    this.apps.forEach((app) => {
      app.profiles?.forEach((profile) => {
        const appProfile = {
          ...app,
          profile
        }
        delete appProfile.profiles
        appProfiles.push(appProfile)
      })
    })
    return appProfiles
  }

  async resetData (): Promise<void> {
    this.log('func:resetData')
    await browser.storage.sync.clear()
  }

  async saveData (dataKey: string, data: unknown): Promise<void> {
    this.log(`func:saveData:${dataKey}`)
    this.log(data)
    const dataObj = {}
    dataObj[dataKey] = JSON.stringify(
      typeof data === 'object' ? { ...data, updatedAt: Date.now() } : data
    )
    await browser.storage.sync.set(dataObj)
  }

  saveUser (user: UserData): void {
    const userId = user.userId
    if ('custom' in user) {
      void this.saveData(`${this.config.name}-custom-${userId}`, user.custom)
      const userData = user
      userData.custom = {}
      void this.saveData(`${this.config.name}-user-${userId}`, userData)
    } else {
      void this.saveData(`${this.config.name}-user-${userId}`, user)
    }
  }

  saveAppProfiles (user: UserData): void {
    this.log('func:saveAppProfiles')
    const appProfiles = this.parseAppProfiles()
    appProfiles.forEach((appProfile) => {
      void this.saveData(appProfile.profile?.id, appProfile)
    })
    const appProfileIds = appProfiles.map((ap) => ap.profile?.id)
    const data = { ...user, appProfileIds }
    this.saveUser(data)
  }

  customizeProfiles (user: UserData, appProfiles: AppData[]): AppData[] {
    const defaults = {
      favorite: false,
      label: null
    }
    const customProfiles: AppData[] = []
    appProfiles.forEach((ap) => {
      const profile = { ...ap }
      // eslint-disable-next-line max-len
      profile.profile.custom = ap.profile.id in user.custom ? user.custom[ap.profile.id] : defaults
      customProfiles.push(profile)
    })
    return customProfiles
  }

  async update (user: UserData): Promise<void> {
    this.log('func:updateData')
    await this.loadData().then((data) => {
      const userIds = [user.userId, ...data.users.map((user) => user.userId)]
      void this.saveData(`${this.config.name}-users`, { users: [...new Set(userIds)] })
      this.saveAppProfiles(user)
    })
  }
}

export default Extension
