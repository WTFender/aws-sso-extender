import { AppData, ExtensionData, UserData } from '../types';

const users: UserData[] = [
  {
    updatedAt: 0,
    appProfileIds: [
      'p-123',
      'p-124',
      'p-125',
      'p-126',
      'p-127',
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
      accounts: {
        '123412341234': {
          color: '880808',
          label: 'AO-Label',
          favorite: true,
          hide: false,
          iamRoles: [{
            profileId: 'p-789',
            accountId: '123412341234',
            roleName: 'AO-IAM-roleName',
            color: '880808',
            label: 'AO-DemoCrossAccountRole',
          }],
        },
      },
      accountsOverride: false,
      displayName: '',
      sessionLabelSso: 'demo {{profile}} @ {{account}}',
      sessionLabelIam: 'demo {{role}} @ {{account}}',
      labelHeader: true,
      labelFooter: true,
      labelIcon: true,
      colorHeader: true,
      colorFooter: true,
      colorDefault: '222f3e',
      profiles: {
        'p-123': {
          color: '23b0ff',
          label: null,
          favorite: true,
          hide: false,
          iamRoles: [{
            profileId: 'p-123',
            accountId: '432143214321',
            roleName: 'IAM-roleName',
            color: '23b0ff',
            label: 'DemoCrossAccountRole',
          }],
        },
        'p-124': {
          color: 'FF5733',
          label: null,
          favorite: false,
          hide: false,
          iamRoles: [{
            profileId: 'p-124',
            accountId: '432143214321',
            roleName: 'IAM-roleName',
            color: 'FF5733',
            label: 'DemoCrossAccountRole2',
          }],
        },
        'p-125': {
          color: 'FF5733',
          label: null,
          favorite: true,
          hide: false,
          iamRoles: [],
        },
      },
      hotkeys: {
        openProfile1: 'Ctrl+Shift+1',
        openProfile2: 'Ctrl+Shift+2',
        openProfile3: 'Ctrl+Shift+3',
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
        color: '',
        favorite: false,
        hide: false,
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
        color: '',
        favorite: true,
        hide: false,
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
        color: '',
        favorite: false,
        hide: false,
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
    applicationId: 'app-126',
    applicationName: 'AWS Account',
    description: 'AWS administrative console',
    icon: 'https://static.global.sso.amazonaws.com/app-03e8643328913682/icons/default.png',
    id: 'ins-126',
    name: '012345678912 (ClientAccount1)',
    profile: {
      description: '',
      id: 'p-126',
      name: 'ViewerAccess',
      protocol: 'SAML',
      relayState: '',
      url: '',
      custom: {
        color: '',
        favorite: false,
        hide: false,
        label: null,
        iamRoles: [],
      },
    },
    searchMetadata: {
      AccountId: '012345678912',
      AccountName: 'ClientAccount1',
      AccountEmail: 'test@localhost',
    },
  },
  {
    applicationId: 'app-127',
    applicationName: 'AWS Account',
    description: 'AWS administrative console',
    icon: 'https://static.global.sso.amazonaws.com/app-03e8643328913682/icons/default.png',
    id: 'ins-127',
    name: '120123456789 (ClientAccount2)',
    profile: {
      description: '',
      id: 'p-127',
      name: 'ViewerAccess',
      protocol: 'SAML',
      relayState: '',
      url: '',
      custom: {
        color: '',
        favorite: false,
        hide: false,
        label: null,
        iamRoles: [],
      },
    },
    searchMetadata: {
      AccountId: '120123456789',
      AccountName: 'ClientAccount2',
      AccountEmail: 'test@localhost',
    },
  }];

const demoData: ExtensionData = {
  users,
  appProfiles,
  iamLogins: [],
  settings: {
    defaultUser: 'lastUserId',
    enableSync: false,
    copyLinkButton: true,
    lastUserId: users[0].userId,
    lastProfileId: 'p-124',
    firefoxContainers: true,
    firefoxResumeContainer: true,
    firefoxExpireMinsContainer: 480,
    iconColor: 'red',
    navCurrentTab: false,
    showReleaseNotes: true,
    showAllProfiles: false,
    tableSettings: {
      showAllUsers: false,
      showIamRoles: true,
      showIcon: true,
      sortCustom: false,
      sortApp: 'desc',
      sortProfile: false,
    },
  },
};

export default demoData;
