import extension from '../extension';
import { getFontColor, waitForElement } from '../utils';
import {
  UserData, AppData, ExtensionData, IamRole,
} from '../types';

/* assume IAM roles for SSO users / redirect to switchrole */

const accountPrompts = [
  'Account ID: ',
  'Konto-ID: ',
  'ID de cuenta: ',
  'ID de compte: ',
  'アカウント ID: ',
  'ID Akun: ',
  'ID account: ',
  'ID da conta: ',
  '계정 ID: ',
  '账户 ID: ',
  '帳戶 ID: ',
];

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
    aws.user!.custom.displayName || aws.user!.subject,
    aws.appProfile?.profile.custom?.label || aws.appProfile?.profile.name,
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

function getMenu() {
  return waitForElement('#menu--account');
}
function getHeader() {
  return waitForElement('#awsc-top-level-nav');
}

function getHeaderLabel(userType: AwsConsole['userType']) {
  return waitForElement('#nav-usernameMenu').then((el) => el.querySelectorAll('span')[userType === 'iam' ? 2 : 1]);
}

function getFooter() {
  return waitForElement('#awsc-nav-footer-content');
}

function getFooterLabel() {
  return waitForElement("#awsc-nav-footer-content span[data-testid='awsc-footer-copyright']");
}

function customizeConsole(aws: AwsConsole): void {
  extension.log('customizeConsole');
  const defaultHeader = 'Services';
  const defaultFooter = '© 2023, Amazon Web Services, Inc. or its affiliates.';
  const label = sessionLabel(aws);
  const color = aws.userType === 'iam' && aws.iamRole!.color !== ''
    ? aws.iamRole!.color
    : aws.appProfile?.profile.custom?.color || aws.user?.custom.colorDefault;
  // customize
  let headerLblPromise;
  let footerLblPromise;
  if (aws.user!.custom.colorHeader) {
    getHeader().then((header) => {
      header.style.backgroundColor = `#${color || '222f3e'}`;
    });
    headerLblPromise = getHeaderLabel(aws.userType);
    headerLblPromise.then((headerLbl) => {
      headerLbl.style.color = getFontColor(color);
    });
  }
  if (aws.user!.custom.colorFooter) {
    getFooter().then((footer) => {
      footer.style.backgroundColor = `#${color || '222f3e'}`;
    });
    footerLblPromise = getFooterLabel();
    footerLblPromise.then((footerLbl) => {
      footerLbl.style.color = getFontColor(color);
    });
  }
  if (aws.user!.custom.labelFooter) {
    footerLblPromise ??= getFooterLabel();
    footerLblPromise.then((footerLbl) => {
      footerLbl.textContent = `${aws.user?.custom.labelIcon && aws.appProfile?.profile.custom?.icon ? aws.appProfile?.profile.custom?.icon : ''} ${label || defaultFooter}`;
    });
  }
  // iam user has header already applied
  if (aws.user!.custom.labelHeader) {
    getHeaderLabel(aws.userType).then((headerLbl) => {
      headerLbl.textContent = `${aws.user?.custom.labelIcon && aws.appProfile?.profile.custom?.icon ? aws.appProfile?.profile.custom?.icon : ''} ${label || defaultHeader}`;
    });
  }
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
  const menu = await getMenu();
  const accountMenu = menu.firstElementChild!.firstElementChild!;
  const accountPrompt = accountMenu!.firstElementChild!.getElementsByTagName('span')[0].textContent;
  extension.log(accountPrompt);
  if (accountPrompt === 'Currently active as: ') {
    aws.userType = 'iam';
    aws.accountId = accountMenu!.lastElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
    aws.roleName = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!;
  }
  if (accountPrompts.includes(accountPrompt!)) {
    aws.userType = 'sso';
    aws.accountId = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
    aws.roleName = accountMenu!.lastElementChild!.getAttribute('title')!;
    aws.ssoRoleName = ssoRoleName(aws.roleName);
  }
  if ((aws.userType === 'sso' && aws.ssoRoleName)
    || (aws.userType === 'iam' && aws.roleName)) {
    aws.data = await extension.loadData();
  }
  if (aws.data) { aws.user = extension.findUser(aws.data); }
  if (aws.user && aws.userType === 'sso') {
    aws.iamRole = null;
    aws.appProfile = extension.findAppProfile(aws.ssoRoleName!, aws.accountId!, aws.data!);
  } else if (aws.user && aws.userType === 'iam') {
    aws.iamRole = findIamRole(aws);
    aws.appProfile = extension.findAppProfileByRole(aws.iamRole, aws.user, aws.data!);
  }
  return aws;
}

if (extension.consoleUrlRegex.test(window.location.href)) {
  // get console info
  init().then((aws) => {
    extension.log(aws);

    // customize defined profiles
    if (aws.appProfile) {
      customizeConsole(aws);
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
