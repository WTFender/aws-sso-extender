import { AppData, ExtensionData, UserData } from '../types';

const users: UserData[] = [
  {
    updatedAt: 0,
    appProfileIds: [
      'p-123',
      'p-124',
      'p-125',
    ],
    accountId: '123412341234',
    adGUID: '',
    adImmutableId: '',
    authContextClass: {},
    awsAccessAttributes: {},
    awsFederationNotReadyReasonDetails: {},
    awsFederationStatus: '',
    directoryType: '',
    email: 'test@localhost',
    employeeId: '',
    externalAttributes: {},
    familyName: '',
    givenName: '',
    groups: [],
    identityStoreUserId: '',
    managedActiveDirectoryId: 'd-123456',
    middleName: '',
    name: 'demo user',
    originSessionId: '',
    preferredUsername: 'demouser',
    sourceGUID: '',
    ssoInstanceId: 'ssoins-123',
    subject: 'demouser',
    userId: 'demoUserId1',
    custom: {
      labelHeader: true,
      labelFooter: true,
      colorHeader: true,
      colorFooter: true,
      colorDefault: '222f3e',
      profiles: {
        'p-123': {
          label: null,
          favorite: true,
          iamRoles: [{
            profileId: 'p-123',
            accountId: '432143214321',
            roleName: 'IAM-roleName',
            color: '23b0ff',
            label: 'DemoCrossAccountRole',
          }],
        },
      },
    },
  },
];

const appProfiles: AppData[] = [
  {
    applicationId: 'app-123',
    applicationName: 'AWS Account',
    description: 'AWS administrative console',
    icon: 'https://static.global.sso.amazonaws.com/app-03e8643328913682/icons/default.png',
    id: 'ins-123',
    name: '432143214321 (Development)',
    profile: {
      description: '',
      id: 'p-123',
      name: 'AdministratorAccess',
      protocol: 'SAML',
      relayState: '',
      url: '',
      custom: {
        favorite: false,
        label: null,
        iamRoles: [{
          profileId: 'p-123',
          accountId: '432143214321',
          roleName: 'IAM-roleName',
          color: '23b0ff',
          label: 'DemoCrossAccountRole',
        }],
      },
    },
    searchMetadata: {
      AccountId: '432143214321',
      AccountName: 'Development',
      AccountEmail: 'test@localhost',
    },
  },
  {
    applicationId: 'app-124',
    applicationName: 'AWS Account',
    description: 'AWS administrative console',
    icon: 'https://static.global.sso.amazonaws.com/app-03e8643328913682/icons/default.png',
    id: 'ins-124',
    name: '123412341234 (Production)',
    profile: {
      description: '',
      id: 'p-124',
      name: 'AdministratorAccess',
      protocol: 'SAML',
      relayState: '',
      url: '',
      custom: {
        favorite: true,
        label: null,
        iamRoles: [],
      },
    },
    searchMetadata: {
      AccountId: '123412341234',
      AccountName: 'Production',
      AccountEmail: 'test@localhost',
    },
  },
  {
    applicationId: 'app-125',
    applicationName: 'AWS Account',
    description: 'AWS administrative console',
    icon: 'https://static.global.sso.amazonaws.com/app-03e8643328913682/icons/default.png',
    id: 'ins-125',
    name: '123412341234 (Production)',
    profile: {
      description: '',
      id: 'p-125',
      name: 'ViewerAccess',
      protocol: 'SAML',
      relayState: '',
      url: '',
      custom: {
        favorite: false,
        label: null,
        iamRoles: [],
      },
    },
    searchMetadata: {
      AccountId: '123412341234',
      AccountName: 'Production',
      AccountEmail: 'test@localhost',
    },
  }];

const demoData: ExtensionData = {
  users,
  appProfiles,
  iamLogins: [],
  settings: {
    defaultUser: 'lastUserId',
    lastUserId: users[0].userId,
  },
};

export default demoData;
