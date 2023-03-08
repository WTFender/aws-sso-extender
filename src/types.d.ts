type ExtensionConfig = {
  id: string;
  name: string;
  display: string;
  debug: boolean;
};

type AppProfileData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles?: Array<any>;
  description: string;
  id: string;
  name: string;
  protocol: string;
  relayState: string;
  url: string;
};

type AppData = {
  applicationId: string;
  applicationName: string;
  description: string;
  icon: string;
  id: string;
  name: string;
  profiles: AppProfileData[];
  profile?: AppProfileData;
  searchMetadata: {
    AccountId: string;
    AccountName: string;
    AccountEmail: string;
  };
};

type UserData = {
  accountId: string;
  adGUID: string;
  adImmutableId: string;
  authContextClass: object;
  awsAccessAttributes: object;
  awsFederationNotReadyReasonDetails: object;
  awsFederationStatus: string;
  directoryType: string;
  email: string;
  employeeId: string;
  externalAttributes: object;
  familyName: string;
  givenName: string;
  groups: string[];
  identityStoreUserId: string;
  managedActiveDirectoryId: string;
  middleName: string;
  name: string;
  originSessionId: string;
  preferredUsername: string;
  sourceGUID: string;
  ssoInstanceId: string;
  subject: string;
  userId: string;
};

type ExtensionData = {
  user: UserData;
  apps: AppData[];
}
