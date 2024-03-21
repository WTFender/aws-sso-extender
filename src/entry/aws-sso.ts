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
  await RateLimiter();
  await Semaphore.acquire();
  return (api('/instance/appinstances').then(
    (data) => data.result,
  ) as Promise<AppData[]>).finally(() => { Semaphore.release(); });
}

async function getAppProfiles(app: AppData): Promise<ProfileData[]> {
  await RateLimiter();
  await Semaphore.acquire();
  return (api(`/instance/appinstance/${app.id}/profiles`).then(
    (data) => data.result,
  ) as Promise<ProfileData[]>).finally(() => { Semaphore.release(); });
}

if (extension.ssoUrlRegex.test(window.location.href)) {
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
                  const appWithProfiles = app;
                  appWithProfiles.profiles = appProfiles;
                  extension.apps.push(appWithProfiles);
                }),
              );
            });
            Promise.all(profiles).then(() => {
              extension.update(user);
              extension.loaded = true;
            }).catch((err) => {
              throw new Error('Something went terribly wrong and it needs to be handled', { cause: err });
            });
          });
        });
    
    });
  }, delay);

}
