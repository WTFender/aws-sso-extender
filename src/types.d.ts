import { Browser } from 'webextension-polyfill';

export type ContextualIdentity = typeof Browser.contextualIdentities.ContextualIdentity;

export interface ExtensionConfig {
  id: string
  name: string
  display: string
  debug: boolean
  build: string
  permissions: {
    sso: string[]
    signin: string[]
    console: string[]
    containers: string[]
  }
  browser: Browser
  delay: number
  version: string
}

export interface ExtensionSettings {
  theme: string;
  darkMode: boolean | 'system';
  copyLinkButton: boolean;
  defaultUser: string;
  enableSync: boolean;
  firefoxContainers?: boolean;
  firefoxResumeContainer: boolean;
  firefoxExpireMinsContainer: number;
  iconColor: string;
  lastUserId: string;
  lastProfileId: string;
  navCurrentTab: boolean;
  showReleaseNotes: boolean;
  showAllProfiles: boolean;
  tableSettings: {
    showAllUsers: boolean;
    showIamRoles: boolean;
    showIcon: boolean;
    sortCustom: boolean;
    sortApp: boolean | string;
    sortProfile: boolean | string;
  };
}

export interface ExtensionPermissions {
  sso: boolean
  history: boolean
  console: boolean
  signin: boolean
  containers: boolean
}

export interface ExtensionData {
  users: UserData[]
  appProfiles: AppData[]
  settings: ExtensionSettings
  iamLogins: IamRole[]
  updatedAt?: number
}

export interface ExtensionMessage {
  action: 'enableFirefoxContainers' | 'disableFirefoxContainers' | 'expireFirefoxContainer' | 'openProfile1' | 'openProfile2' | 'openProfile3'
  cookieStoreId?: string
}

export interface ApiData {
  result: AppData[] | ProfileData[]
}

export interface UserData {
  updatedAt: number
  custom: {
    displayName: string,
    sessionLabelSso: string,
    sessionLabelIam: string,
    colorDefault: string,
    colorFooter: boolean,
    colorHeader: boolean,
    labelFooter: boolean,
    labelHeader: boolean,
    labelIcon: boolean,
    profiles: Record<string, CustomData>
    hotkeys: {
      openProfile1: string,
      openProfile2: string,
      openProfile3: string,
    }
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
  preview?: string
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
  sortName?: string
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
  hide?: boolean
  icon?: string | null
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

export interface UserConfig {
  user: UserData['custom']
  extension: ExtensionSettings
}
