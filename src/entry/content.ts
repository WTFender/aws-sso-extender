import extension from '../extension';
import {
  ApiData, AppData, ProfileData, UserData,
} from '../types';

/* collect user, app, and profiles from the AWS SSO directory page */

function getRegion(): string {
  const region = (
    document.head.querySelector('[name~=region][content]') as HTMLMetaElement
  ).content;
  extension.log(`func:getRegion:${region}`);
  return region;
}

function getToken(): string {
  const ssoKey = 'x-amz-sso_authn';
  const cookies = Object.fromEntries(
    document.cookie
      .split('; ')
      .map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
  );
  extension.log('func:getToken');
  return cookies[ssoKey];
}

async function api(path: string): Promise<ApiData> {
  extension.log(`func:api:${path}`);
  return fetch(`${extension.ssoUrl}${path}`, {
    headers: { 'x-amz-sso_bearer_token': getToken() },
  }).then(async (response) => {
    extension.log(`func:api:${path}:results`);
    return await response.json() as ApiData;
  });
}

async function getUserData(): Promise<UserData> {
  return (api('/user') as unknown as Promise<UserData>);
}

async function getApps(): Promise<AppData[]> {
  return (api('/instance/appinstances').then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (data) => data.result,
  ) as Promise<AppData[]>);
}

async function getAppProfiles(app: AppData): Promise<ProfileData[]> {
  return (api(`/instance/appinstance/${app.id}/profiles`).then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (data) => data.result,
  ) as Promise<ProfileData[]>);
}

if (extension.ssoUrlRegex.test(window.location.href)) {
  // getUserData > getApps > getProfiles > resolve promises > saveData
  extension.log('func:run');
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
