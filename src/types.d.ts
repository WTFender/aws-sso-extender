export interface ExtensionConfig {
  id: string
  name: string
  display: string
  debug: boolean
  origins: string[]
}

export interface ExtensionSettings {
  defaultUser: string
  lastUserId: string
}

export interface ExtensionPermissions {
  origins: string[]
  history: boolean
}

export interface ExtensionData {
  users: UserData[]
  appProfiles: AppData[]
  settings: ExtensionSettings
  updatedAt?: number
}

export interface ApiData {
  result: AppData[] | ProfileData[]
}

export interface UserData {
  updatedAt: number
  custom: Record<string, CustomData>
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
  applicationId: string
  applicationName: string
  description: string
  icon: string
  id: string
  name: string
  profiles?: ProfileData[]
  profile: ProfileData
  searchMetadata: {
    AccountId: string
    AccountName: string
    AccountEmail: string
  }
}

export interface ProfileData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}
