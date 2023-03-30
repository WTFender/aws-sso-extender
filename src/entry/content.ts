import extension from '../extension'
import { ApiData, AppData, ProfileData, UserData } from '../types'

/* collect user, app, and profiles from the AWS SSO directory page */

function getRegion (): string {
  const region = (
    document.head.querySelector('[name~=region][content]') as HTMLMetaElement
  ).content
  extension.log(`func:getRegion:${region}`)
  return region
}

function getToken (): string {
  const ssoKey = 'x-amz-sso_authn'
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cookies = Object.fromEntries(
    document.cookie
      .split('; ')
      .map((v) => v.split(/=(.*)/s).map(decodeURIComponent))
  )
  extension.log('func:getToken')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return cookies[ssoKey]
}

async function getUserData (): Promise<UserData> {
  return await (api('/user') as unknown as Promise<UserData>)
}

async function getApps (): Promise<AppData[]> {
  return await (api('/instance/appinstances').then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (data) => data.result
  ) as Promise<AppData[]>)
}

async function getAppProfiles (app: AppData): Promise<ProfileData[]> {
  return await (api(`/instance/appinstance/${app.id}/profiles`).then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (data) => data.result
  ) as Promise<ProfileData[]>)
}

async function api (path: string): Promise<ApiData> {
  extension.log(`func:api:${path}`)
  return await fetch(`${extension.ssoUrl}${path}`, {
    headers: { 'x-amz-sso_bearer_token': getToken() }
  }).then(async (response) => {
    extension.log(`func:api:${path}:results`)
    return await response.json() as ApiData
  })
}


// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/strict-boolean-expressions
if (extension.ssoUrlRegex.test(window.location.href)) {
  // getUserData > getApps > getProfiles > resolve promises > saveData
  extension.log('func:run')
  extension.ssoUrl = `https://portal.sso.${getRegion()}.amazonaws.com`
  getUserData().then((user) => {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const profiles: Array<Promise<ProfileData | void>> = []
    void getApps().then((apps) => {
      apps.forEach((app) => {
        profiles.push(
          getAppProfiles(app).then((appProfiles) => {
            const appWithProfiles = app
            appWithProfiles.profiles = appProfiles
            extension.apps.push(appWithProfiles)
          })
        )
      })
      void Promise.all(profiles).then(() => {
        void extension.update(user)
        extension.loaded = true
      })
    })
  })
}
