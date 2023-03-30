import extension from '../extension';
import { AppData } from '../types';

/* redirect SSO users to IAM roles */

function findAccountId(): string {
  const accountMenu = document.getElementById('menu--account');
  const accountId = accountMenu!
    .firstElementChild!
    .firstElementChild!
    .firstElementChild!
    .getElementsByTagName('span')[1]!
    .textContent!
    .replaceAll('-', '')!;
  return accountId !== null ? accountId : '';
}

function findRoleName(): string {
  const accountMenu = document.getElementById('menu--account');
  const roleName = accountMenu!
    .firstElementChild!
    .firstElementChild!
    .lastElementChild!.getAttribute('title')!;
  return roleName;
}

function parseSsoRoleName(roleName: string): string {
  if (!roleName) { throw Error('No roleName provided'); }
  if (!roleName.startsWith('AWSReservedSSO_')) { throw Error('roleName is not an SSO role'); }
  return roleName.split('_')[1];
}

function findAppProfile(
  roleName: string,
  accountId: string,
  appProfiles: AppData[],
): AppData {
  let appProfile;
  appProfiles.forEach((ap) => {
    if (ap.applicationName === 'AWS Account') {
      if (ap.searchMetadata.AccountId === accountId
          && ap.profile.name === roleName) {
        appProfile = ap;
      }
    }
  });
  return appProfile;
}

if (window.location.href.includes('console.aws.amazon.com/console/home')) {
  const accountId = findAccountId();
  const roleName = findRoleName();
  if (accountId && roleName) {
    extension.loadData().then((data) => {
      const ssoRoleName = parseSsoRoleName(roleName);
      if (ssoRoleName) {
        const appProfile = findAppProfile(ssoRoleName, accountId, data.appProfiles);
        if (appProfile) {
          extension.log(data.iamLogins);
          if (appProfile.profile.id in data.iamLogins) {
            const role = data.iamLogins[appProfile.profile.id];
            if (role.profileId === appProfile.profile.id) {
              extension.switchRole({
                ...role,
                label: `${role.accountId}-${role.roleName}`,
                color: 'ffffff',
              }).then(() => {
                setTimeout(() => { window.location.reload(); }, 250);
              });
            }
          }
        }
      } else {
        // todo roleName
      }
    });
  }
}
