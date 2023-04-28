import extension from '../extension';
import { waitForElement } from '../utils';
import {
  UserData, AppData, ExtensionData, IamRole,
} from '../types';

/* assume IAM roles for SSO users / redirect to switchrole */

type AwsConsole = {
  userType: 'iam' | 'sso' | null
  accountId: string | null
  roleName: string | null
  ssoRoleName: string | null
  data: ExtensionData | null
  user: UserData | null
  appProfile: AppData | null
  iamRole: IamRole | null
};

function sessionLabel(aws: AwsConsole): string {
  let role: string | null = null;
  let label;
  let account;
  let accountName;
  const profile = aws.appProfile?.profile.custom?.label || aws.appProfile?.profile.name;
  if (aws.userType === 'iam') {
    label = aws.user?.custom.sessionLabelIam;
    role = aws.iamRole?.label || aws.iamRole?.roleName as string;
    account = aws.iamRole?.accountId;
    const metadata = aws.data?.appProfiles.filter((ap) => ap.searchMetadata?.AccountId === account);
    accountName = metadata![0].searchMetadata?.AccountName;
  } else {
    label = aws.user?.custom.sessionLabelSso;
    account = aws.appProfile?.searchMetadata?.AccountId;
    accountName = aws.appProfile?.searchMetadata?.AccountName;
  }
  return extension.buildLabel(
    label,
    aws.user!.subject,
    profile,
    role,
    account,
    accountName,
  );
}

function ssoRoleName(roleName: string): string | null {
  if (!roleName) { return null; }
  if (!roleName.startsWith('AWSReservedSSO_')) { throw Error('roleName is not an SSO role'); }
  return roleName.split('_')[1];
}

function findIamRole(aws: AwsConsole): IamRole {
  extension.log('findIamRole');
  const iamRoles: IamRole[] = [];
  aws.data?.users.forEach((user) => {
    // app profiles
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-restricted-syntax
    for (const [profileId, profile] of Object.entries(user.custom.profiles)) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      profile.iamRoles.forEach((role) => {
        if (role.accountId === aws.accountId
          && role.roleName === aws.roleName) {
          // eslint-disable-next-line vue/max-len
          iamRoles.push(role);
        }
      });
    }
  });
  extension.log(iamRoles);
  return iamRoles.filter((r) => r.profileId === aws.data?.settings.lastProfileId)[0];
}

function findUser(aws: AwsConsole): UserData {
  // eslint-disable-next-line vue/max-len
  const activeUserId = aws.data!.users.length === 1 ? aws.data!.users[0].userId : aws.data!.settings.lastUserId;
  return aws.data!.users.filter((u) => u.userId === activeUserId)[0];
}

function findAppProfileByRole(aws: AwsConsole): AppData {
  // eslint-disable-next-line vue/max-len
  const appProfiles = aws.data!.appProfiles.filter((ap) => ap.profile.id === aws.iamRole?.profileId);
  extension.log('findAppProfileByRole');
  extension.log(appProfiles);
  return extension.customizeProfiles(aws.user as UserData, appProfiles)[0];
}

function findAppProfile(aws: AwsConsole): AppData | null {
  extension.log('findAppProfile');
  const data = aws.data as ExtensionData;
  const appProfiles: AppData[] = [];
  const activeUserId = data.users.length === 1 ? data.users[0].userId : data.settings.lastUserId;
  data.users.forEach((user) => {
    if (user.userId === activeUserId) {
      data.appProfiles.forEach((ap) => {
        if (ap.applicationName === 'AWS Account') {
          // sso user, check for matching app profile
          if (ap.profile.name === aws.ssoRoleName) {
            appProfiles.push(extension.customizeProfiles(user, [ap])[0]);
          }
        }
      });
    }
  });
  extension.log(appProfiles);
  return appProfiles[0];
}

function checkIamLogins(aws: AwsConsole) {
  extension.log('console:checkIamLogins');
  const data = aws.data as ExtensionData;
  const ap = aws.appProfile as AppData;
  extension.log(data.iamLogins);
  if (ap.profile.id in data.iamLogins) {
    const role: IamRole = data.iamLogins[ap.profile.id];
    if (role.profileId === ap.profile.id) {
      extension.switchRole({
        ...role,
        label: encodeURIComponent(sessionLabel(aws)),
      });
      extension.removeIamLogin(role.profileId);
    }
  }
}

function getFontColor(hexcolor): 'black' | 'white' {
  extension.log(hexcolor);
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 180) ? 'black' : 'white';
}

async function customizeConsole(aws: AwsConsole): Promise<Boolean> {
  extension.log('customizeConsole');
  const defaultHeader = 'Services';
  const defaultFooter = '© 2023, Amazon Web Services, Inc. or its affiliates.';
  const label = sessionLabel(aws);
  const color = aws.userType === 'iam' && aws.iamRole!.color !== ''
    ? aws.iamRole!.color
    : aws.appProfile?.profile.custom?.color || aws.user?.custom.colorDefault;
  // const header = document.getElementById('awsc-top-level-nav');
  const header = await waitForElement('#awsc-top-level-nav');
  /*
  const headerLbl = document.getElementById('nav-usernameMenu')!.querySelectorAll('span')[
    aws.userType === 'iam' ? 2 : 1
  ];
  */
  const headerLbl = await waitForElement('#nav-usernameMenu').then((el) => el.querySelectorAll('span')[
    aws.userType === 'iam' ? 2 : 1
  ]);
  const footer = await waitForElement('#awsc-nav-footer-content');
  const footerLbl = await waitForElement('div._awsc-footer__inner__content__center_swu42_106 > span', { parentNode: footer });
  // const footer = document.getElementById('awsc-nav-footer-content');
  // const footerLbl = footer!.querySelectorAll('span')[5];
  if (!header || !headerLbl || !footer || !footerLbl) {
    extension.log('customizeConsole:missing-elements');
    return false;
  }
  // customize
  if (aws.user!.custom.colorHeader) {
    header!.style.backgroundColor = `#${color || '222f3e'}`;
    headerLbl!.style.color = getFontColor(color);
  }
  if (aws.user!.custom.colorFooter) {
    footer!.style.backgroundColor = `#${color || '222f3e'}`;
    footerLbl!.style.color = getFontColor(color);
  }
  if (aws.user!.custom.labelFooter) { footerLbl!.textContent = label || defaultFooter; }
  // iam user has header already applied
  if (aws.user!.custom.labelHeader) { headerLbl!.textContent = label || defaultHeader; }
  return true;
}

async function init(): Promise<AwsConsole> {
  const aws: AwsConsole = {
    userType: null,
    accountId: null,
    roleName: null,
    ssoRoleName: null,
    data: null,
    user: null,
    appProfile: null,
    iamRole: null,
  };
  const accountMenu = document.getElementById('menu--account')!
    .firstElementChild!.firstElementChild!;
  const accountPrompt = accountMenu!.firstElementChild!.getElementsByTagName('span')[0].textContent;
  if (accountPrompt === 'Currently active as: ') {
    aws.userType = 'iam';
    aws.accountId = accountMenu!.lastElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
    aws.roleName = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!;
  } if (accountPrompt === 'Account ID: ') {
    aws.userType = 'sso';
    aws.accountId = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
    aws.roleName = accountMenu!.lastElementChild!.getAttribute('title')!;
    aws.ssoRoleName = ssoRoleName(aws.roleName);
  }
  if ((aws.userType === 'sso' && aws.ssoRoleName)
    || (aws.userType === 'iam' && aws.roleName)) {
    aws.data = await extension.loadData();
  }
  if (aws.data) { aws.user = findUser(aws); }
  if (aws.user && aws.userType === 'sso') {
    aws.iamRole = null;
    aws.appProfile = findAppProfile(aws);
  } else if (aws.user && aws.userType === 'iam') {
    aws.iamRole = findIamRole(aws);
    aws.appProfile = findAppProfileByRole(aws);
  }
  return aws;
}

if (window.location.href.includes('console.aws.amazon.com/console/home')) {
  // get console info
  init().then((aws) => {
    extension.log(aws);

    // customize defined profiles
    if (aws.appProfile) {
      if (!customizeConsole(aws)) {
        setTimeout(() => {
          customizeConsole(aws);
        }, extension.config.delay * 2);
      }
    }

    // sso user, check for pending iam logins, switch role (soft POST)
    if (aws.userType === 'sso' && aws.appProfile) {
      checkIamLogins(aws);

      // iam user, check for pending iam logins, remove matching
    } else if (aws.userType === 'iam' && aws.appProfile) {
      extension.removeIamLogin(aws.appProfile!.profile.id);
    }
  });
}
