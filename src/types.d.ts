import { Browser } from 'webextension-polyfill';

export interface ExtensionConfig {
  id: string
  name: string
  display: string
  debug: boolean
  permissions: {
    sso: string[]
    signin: string[]
    console: string[]
  }
  browser: Browser
  db: browser.Storage.SyncStorageAreaSync | browser.Storage.LocalStorageArea
  delay: number
}

export interface ExtensionSettings {
  defaultUser: string
  lastUserId: string
  lastProfileId: string
}

export interface ExtensionPermissions {
  sso: string[]
  history: boolean
}

export interface ExtensionData {
  users: UserData[]
  appProfiles: AppData[]
  settings: ExtensionSettings
  iamLogins: IamRole[]
  updatedAt?: number
}

export interface ApiData {
  result: AppData[] | ProfileData[]
}

export interface UserData {
  updatedAt: number
  custom: {
    sessionLabelSso: string,
    sessionLabelIam: string,
    colorDefault: string,
    colorFooter: boolean,
    colorHeader: boolean,
    labelFooter: boolean,
    labelHeader: boolean,
    profiles: Record<string, CustomData>
  }
  appProfileIds: string[]
  accountId: string
  adGUID: string
  adImmutableId: string
  authContextClass: object
  awsAccessAttributes: object
  awsFederationNotReadyReasonDetails: object
  awsFederationStatus: string
  directoryType: string
  email: string
  employeeId: string
  externalAttributes: object
  familyName: string
  givenName: string
  groups: string[]
  identityStoreUserId: string
  managedActiveDirectoryId: string
  middleName: string
  name: string
  originSessionId: string
  preferredUsername: string
  sourceGUID: string
  ssoInstanceId: string
  subject: string
  userId: string
}

export interface AppData {
  label?: string
  applicationId: string
  applicationName: string
  description: string
  icon: string
  id: string
  name: string
  profiles?: ProfileData[]
  profile: ProfileData
  searchMetadata?: {
    AccountId: string
    AccountName: string
    AccountEmail: string
  }
}

export interface ProfileData {
  profiles?: any[]
  description: string
  id: string
  name: string
  protocol: string
  relayState: string
  url: string
  custom?: CustomData
}

export interface CustomData {
  favorite?: boolean
  label?: string | null
  color: string;
  iamRoles: IamRole[]
}

export interface IamRole {
  profileId: string
  accountId: string
  roleName: string
  label: string
  color: string
}
