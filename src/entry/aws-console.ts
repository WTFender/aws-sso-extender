import extension from '../extension';
import { AppData, ExtensionData, IamRole } from '../types';

/* redirect SSO users to IAM roles */

type AwsConsole = {
  userType: 'iam' | 'sso' | null
  accountId: string | null
  roleName: string | null
  ssoRoleName: string | null
  data: ExtensionData | null
  appProfile: AppData | null
};

function sessionLabel(role: IamRole, ap: AppData): string {
  let label = '';
  if (role.label !== '') {
    label = extension.buildRoleLabel(role, ap);
  } else if (ap.profile.custom?.label !== null) {
    label = `${role.roleName} @ ${role.accountId} via ${ap.profile.custom?.label}`;
  } else {
    label = `${role.roleName} @ ${role.accountId} via ${ap.profile.name}`;
  }
  return encodeURIComponent(label);
}

function ssoRoleName(roleName: string): string | null {
  if (!roleName) { return null; }
  if (!roleName.startsWith('AWSReservedSSO_')) { throw Error('roleName is not an SSO role'); }
  return roleName.split('_')[1];
}

function findAppProfileByRole(aws: AwsConsole): AppData | null {
  const iamLogins = aws.data?.iamLogins;
  const appProfiles: AppData[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [profileId, role] of Object.entries(iamLogins!)) {
    if (role.accountId === aws.accountId && role.roleName === aws.roleName) {
      aws.data?.appProfiles.forEach((ap) => {
        if (ap.profile.id === profileId) {
          appProfiles.push(ap);
        }
      });
    }
  }
  return appProfiles[0];
}

function findAppProfile(aws: AwsConsole): AppData | null {
  extension.log('findAppProfile');
  const data = aws.data as ExtensionData;
  const appProfiles: AppData[] = [];
  const activeUserId = data.users.length === 1 ? data.users[0].userId : data.settings.lastUserId;
  data.users.forEach((user) => {
    if (user.userId === activeUserId) {
      data.appProfiles.forEach((ap) => {
        const roleName = aws.userType === 'sso' ? aws.ssoRoleName : aws.roleName;
        if (ap.applicationName === 'AWS Account') {
          if (ap.searchMetadata!.AccountId === aws.accountId
            && ap.profile.name === roleName) {
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
      // redirect user to iam role
      extension.switchRole({
        ...role,
        label: sessionLabel(role, ap),
      }).then(() => {
        setTimeout(() => {
          window.location.reload();
        }, extension.config.delay);
      });
    }
  }
}

async function init(): Promise<AwsConsole> {
  const aws: AwsConsole = {
    userType: null,
    accountId: null,
    roleName: null,
    ssoRoleName: null,
    data: null,
    appProfile: null,
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
  if (aws.data) {
    aws.appProfile = aws.userType === 'sso' ? findAppProfile(aws) : findAppProfileByRole(aws);
  }
  return aws;
}

if (window.location.href.includes('console.aws.amazon.com/console/home')) {
  // allow storage to update from popup, console menus to load
  setTimeout(() => {
    // get console info
    init().then((aws) => {
      extension.log(aws);
      // sso user, check for pending iam logins, redirect
      if (aws.userType === 'sso' && aws.appProfile) {
        checkIamLogins(aws);
        // iam user, check for pending iam logins, remove matching
      } else if (aws.userType === 'iam' && aws.appProfile) {
        extension.removeIamLogin(aws.appProfile!.profile.id);
      }
    });
  }, extension.config.delay);
}
