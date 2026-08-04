import extension from '../extension';
import { AppData, ProfileData, UserData } from '../types';
import { waitForElement } from '../utils';
import api, { RateLimiter, Semaphore } from '../utils/api';

/* collect user, app, and profiles from the AWS SSO directory page */

interface AwsEnvironment {
  FDLEnabled: boolean
  PKCEEnabled: boolean
  allowAllCookiesByDefault: boolean
  oidcApiEndpoint: string
  panoramaEnabled: true
  partition: string
  region: string
  shortbreadEnabled: boolean
  stage: string
}

function getEnvironment(): Promise<AwsEnvironment>{
  return waitForElement('#env').then((envEl) => {
    return JSON.parse(envEl.textContent!);
  });
}

async function getUserData(): Promise<UserData> {
  await RateLimiter();
  await Semaphore.acquire();
  return (api('/user') as unknown as Promise<UserData>).finally(() => { Semaphore.release(); });
}

async function getApps(): Promise<AppData[]> {
  const apps: AppData[] = [];
  let nextToken: string | undefined;

  do {
    await RateLimiter();
    await Semaphore.acquire();

    const path = nextToken
      ? `/instance/appinstances?next_token=${encodeURIComponent(nextToken)}`
      : '/instance/appinstances';

    // eslint-disable-next-line no-await-in-loop
    const data = await api(path).finally(() => { Semaphore.release(); });

    apps.push(...(data.result as AppData[]));
    nextToken = data.paginationToken;
  } while (nextToken);

  return apps;
}

async function getAppProfiles(app: AppData): Promise<ProfileData[]> {
  const profiles: ProfileData[] = [];
  let nextToken: string | undefined;

  do {
    await RateLimiter();
    await Semaphore.acquire();

    const base = `/instance/appinstance/${app.id}/profiles`;
    const path = nextToken
      ? `${base}?next_token=${encodeURIComponent(nextToken)}`
      : base;

    // eslint-disable-next-line no-await-in-loop
    const data = await api(path).finally(() => { Semaphore.release(); });

    profiles.push(...(data.result as ProfileData[]));
    nextToken = data.paginationToken;
  } while (nextToken);

  return profiles;
}

extension.log(window.location.href);
// delay if sso login is still in progress, need to wait on session token
let delay = window.location.href.includes('state=') ? (extension.config.delay * 3) : 0;
extension.log(`aws-sso:delay:${delay}`);
setTimeout(() => {
  getEnvironment().then((env) => {
    extension.log('aws-sso:env');
    extension.log(env);
    // getUserData > getApps > getProfiles > resolve promises > saveData
    extension.ssoUrl = `https://portal.sso.${env.region}.amazonaws.com`;
      getUserData().then((user) => {
        const profiles: Array<Promise<ProfileData | void>> = [];
        getApps().then((apps) => {
          apps.forEach((app) => {
            profiles.push(
              getAppProfiles(app).then((appProfiles) => {
                const appWithProfiles = { ...app, profiles: appProfiles };
                extension.apps.push(appWithProfiles);
              }),
            );
          });
          Promise.all(profiles).then(() => {
            extension.update(user);
            extension.loaded = true;
          }).catch((err) => {
            extension.log(`aws-sso:error:${err.message}`);
            throw new Error('Something went terribly wrong and it needs to be handled', { cause: err });
          });
        });
      });
  
  });
}, delay);
