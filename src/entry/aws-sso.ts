import extension from '../extension';
import {
  ApiData, AppData, ProfileData, UserData,
} from '../types';

/* collect user, app, and profiles from the AWS SSO directory page */

function getRegion(): string {
  const region = (
    document.head.querySelector('[name~=region][content]') as HTMLMetaElement
  ).content;
  extension.log(`aws-sso:getRegion:${region}`);
  return region;
}

function getToken(): string {
  const ssoKey = 'x-amz-sso_authn';
  return extension.getCookie(ssoKey);
}

async function api(path: string): Promise<ApiData> {
  extension.log(`aws-sso:api:${path}`);
  return fetch(`${extension.ssoUrl}${path}`, {
    headers: { 'x-amz-sso_bearer_token': getToken() },
  }).then(async (response) => {
    extension.log(`aws-sso:api:${path}:results`);
    return await response.json() as ApiData;
  });
}

async function getUserData(): Promise<UserData> {
  return (api('/user') as unknown as Promise<UserData>);
}

async function getApps(): Promise<AppData[]> {
  return (api('/instance/appinstances').then(
    (data) => data.result,
  ) as Promise<AppData[]>);
}

async function getAppProfiles(app: AppData): Promise<ProfileData[]> {
  return (api(`/instance/appinstance/${app.id}/profiles`).then(
    (data) => data.result,
  ) as Promise<ProfileData[]>);
}

if (extension.ssoUrlRegex.test(window.location.href)) {
  // getUserData > getApps > getProfiles > resolve promises > saveData
  extension.log('aws-sso:run');
  extension.ssoUrl = `https://portal.sso.${getRegion()}.amazonaws.com`;
  getUserData().then((user) => {
    const profiles: Array<Promise<ProfileData | void>> = [];
    getApps().then((apps) => {
      apps.forEach((app) => {
        profiles.push(
          getAppProfiles(app).then((appProfiles) => {
            const appWithProfiles = app;
            appWithProfiles.profiles = appProfiles;
            extension.apps.push(appWithProfiles);
          }),
        );
      });
      Promise.all(profiles).then(() => {
        extension.update(user);
        extension.loaded = true;
      });
    });
  });
}
