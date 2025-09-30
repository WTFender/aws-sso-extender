import extension from '../extension';
import { getFontColor, waitForElement } from '../utils';
import {
  UserData, AppData, ExtensionData, IamRole,
} from '../types';

/* assume IAM roles for SSO users / redirect to switchrole */

const ssoAccountPrompts = [
  'Account ID',
  'Konto-ID',
  'ID de cuenta',
  'ID de compte',
  'アカウント ID',
  'ID Akun',
  'ID account',
  'ID da conta',
  '계정 ID',
  '账户 ID',
  '帳戶 ID',
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
    aws.user?.custom.accounts,
  );
}

function ssoRoleName(roleName: string): string | null {
  if (!roleName) { return null; }
  if (!roleName.startsWith('AWSReservedSSO_')) { throw Error('roleName is not an SSO role'); }
  // AWSReservedSSO_ROLE_WITH_UNDERSCORES_641d4a863dea1899/wtfender
  // to
  // ROLE_WITH_UNDERSCORES
  return roleName.substring('AWSReservedSSO_'.length).split('/')[0].slice(0, -17);
}

function findIamRole(aws: AwsConsole): IamRole {
  extension.log('findIamRole');
  const iamRoles: IamRole[] = [];
  aws.data?.users.forEach((user) => {
    // app profiles
    // eslint-disable-next-line no-unused-vars
    for (const [_, profile] of Object.entries(user.custom.profiles)) {
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
      aws.iamRole = role;
      aws.userType = 'iam';
      extension.switchRole(
        encodeURIComponent(sessionLabel(aws)),
        role,
      );
      extension.removeIamLogin(role.profileId);
    }
  }
}

async function getMenu() {
  // In both multi-session and non-multi-session modes, the menu element
  // exists in the DOM (though may be hidden). Use querySelector directly.
  // Add small retry in case the DOM isn't quite ready yet.
  for (let i = 0; i < 20; i++) {
    const menu = document.querySelector('#menu--account');
    if (menu) {
      return menu;
    }
    // Wait a bit if not found yet (rare case)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timeout: Element not found with selector "#menu--account"');
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
    : aws.appProfile?.profile.custom?.color;
  // customize
  let headerLblPromise;
  let footerLblPromise;
  if (aws.user!.custom.colorHeader) {
    getHeader().then((header) => {
      header.style.backgroundColor = `#${color}`;
    });
    headerLblPromise = getHeaderLabel(aws.userType);
    headerLblPromise.then((headerLbl) => {
      headerLbl.style.color = getFontColor(color);
    });
  }
  if (aws.user!.custom.colorFooter) {
    getFooter().then((footer) => {
      footer.style.backgroundColor = `#${color}`;
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

  if (aws.data?.settings.copyLinkButton){
    // make a copy link button
    waitForElement("#awsc-navigation__more-menu--list").then((menuList) => {
      getHeaderLabel(aws.userType).then((headerLbl) => {
        var parentElement:HTMLElement|null = headerLbl;
        var priorNode: HTMLElement|null=null;
        var copiedNode:HTMLElement|null=null;
        // find the li element which is parent of the header label button, shallow clone so we can create a new element with matching style, but not create the other child elements
        while ( parentElement && (priorNode==null || priorNode.nodeName!="LI") )
        {
          copiedNode=<HTMLElement>parentElement.cloneNode()
          // if it's a button we'll change the id to be unique from the label button
          if (copiedNode.nodeName=="BUTTON") copiedNode.id="copyLinkButton"
          // Append the element as a child for each time we go through the loop after the first.  The childmost element will have its text updated
          if (priorNode) {copiedNode.appendChild(priorNode)} else {copiedNode.textContent="Copy Link"; copiedNode.title="Copy link to current AWS console page"}
          priorNode=copiedNode
          parentElement=parentElement.parentElement
        }
        // add the new node we made in the above loop to the nav bar
        if (copiedNode) menuList.append(copiedNode);
        // run the function below when the button is clicked
        document.getElementById("copyLinkButton")?.addEventListener("click", () => copyToClipBoard(aws))
      });
    });
  }
}


function getSsoSubdomain(user: UserData): string {
  // Try to get SSO subdomain from user's custom settings first (for vanity URLs like acme.awsapps.com)
  if (user.custom?.ssoSubdomain) {
    return user.custom.ssoSubdomain;
  }
  // Fall back to managed directory ID (like d-123abc1234)
  return user.managedActiveDirectoryId;
}

function copyToClipBoard(aws: AwsConsole){
  let linkurl: string;

  // Strip multi-session subdomain from destination URL
  // Convert: https://123456789012-abc123xy.us-east-1.console.aws.amazon.com/...
  // To: https://us-east-1.console.aws.amazon.com/...
  const cleanDestinationUrl = window.location.href.replace(/https:\/\/\d{12}-[a-z0-9]+\./, 'https://');

  const ssoSubdomain = getSsoSubdomain(aws.user!);
  linkurl = `https://${ssoSubdomain}.awsapps.com/start/#/console?account_id=${aws.accountId}&role_name=${aws.ssoRoleName}&destination=${encodeURIComponent(cleanDestinationUrl)}`;

  navigator.clipboard.writeText(linkurl);
  waitForElement('#copyLinkButton').then(async (el)=> { var textElement=el.querySelector("span"); if (textElement){textElement.textContent="Link Copied"; await delay(1000); textElement.textContent="Copy Link"}})
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
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

  // Detect if multi-session mode is enabled by checking URL format
  // Multi-session: https://123456789012-abc123xy.us-east-1.console.aws.amazon.com/...
  // Non-multi-session: https://us-east-1.console.aws.amazon.com/...
  const isMultiSession = /^https:\/\/\d{12}-[a-z0-9]+\./.test(window.location.href);
  extension.log(`Multi-session mode: ${isMultiSession}`);

  if (isMultiSession) {
    // Multi-session mode: Parse from button attributes (title has complete info)
    // Wait for the button and its title to be populated (it gets set dynamically)
    let menuButton: Element | null = null;
    let title = '';

    // Poll for title to be populated - usually takes 600-800ms
    for (let i = 0; i < 30; i++) {
      menuButton = document.querySelector('button[aria-controls="menu--account"]');
      title = menuButton?.getAttribute('title') || '';
      if (title) {
        extension.log(`Title found after ${i + 1} attempts`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    extension.log(`Button title: ${title}`);

    // Check for "Federated user" label to detect SSO
    const menu = await getMenu();
    const allElements = Array.from(menu.querySelectorAll('*'));
    const hasFederatedUser = allElements.some(el => el.textContent?.trim() === 'Federated user');

    if (hasFederatedUser) {
      extension.log('sso user (multi-session)');
      aws.userType = 'sso';
    } else {
      extension.log('iam user (multi-session)');
      aws.userType = 'iam';
    }

    // Extract account ID from title
    const accountMatch = title.match(/@\s*([\d-]+)$/);
    if (accountMatch) {
      aws.accountId = accountMatch[1].replaceAll('-', '');
      extension.log(`Account ID: ${aws.accountId}`);
    }

    // Extract role name from title
    const roleMatch = title.match(/^([^/]+)/);
    if (roleMatch) {
      aws.roleName = roleMatch[1].trim();
      extension.log(`Role name: ${aws.roleName}`);
      if (aws.userType === 'sso') {
        aws.ssoRoleName = ssoRoleName(aws.roleName);
        extension.log(`SSO role name: ${aws.ssoRoleName}`);
      }
    }
  } else {
    // Non-multi-session mode: Use original DOM scraping logic
    const menu = await getMenu();
    const accountMenu = menu.firstElementChild!.firstElementChild!;
    const oldAccountPrompt = accountMenu.firstElementChild!.getElementsByTagName('span')[0].textContent || '';
    let accountPrompt = '';
    if (oldAccountPrompt === '') {
      accountPrompt = accountMenu!.firstElementChild!.firstElementChild!.firstElementChild!.firstElementChild!.textContent!;
    }
    if (oldAccountPrompt === 'Currently active as: ') {
      aws.userType = 'iam';
      aws.accountId = accountMenu!.lastElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
      aws.roleName = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!;
    } else if (ssoAccountPrompts.includes(oldAccountPrompt!.replace(': ', ''))) {
      aws.userType = 'sso';
      aws.accountId = accountMenu!.firstElementChild!.getElementsByTagName('span')[1].textContent!.replaceAll('-', '');
      aws.roleName = accountMenu!.lastElementChild!.getAttribute('title')!;
      aws.ssoRoleName = ssoRoleName(aws.roleName);
    } else if (ssoAccountPrompts.includes(accountPrompt)) {
      extension.log('sso user');
      aws.userType = 'sso';
      aws.accountId = accountMenu!.firstElementChild!.getElementsByTagName('span')[3].textContent!.replaceAll('-', '');
      aws.roleName = accountMenu!.firstElementChild!.lastElementChild?.firstElementChild!.getAttribute('title')!;
      aws.ssoRoleName = ssoRoleName(aws.roleName);
    } else {
      extension.log('iam user');
      aws.userType = 'iam';
      aws.accountId = accountMenu.getElementsByTagName('span')[7].textContent!.replaceAll('-', '');
      aws.roleName = accountMenu.getElementsByTagName('span')[3].textContent!
    }
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
