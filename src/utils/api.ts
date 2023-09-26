import { RateLimit, Sema } from 'async-sema';
import fetchRetry from 'fetch-retry';
import extension from '../extension';
import { ApiData } from '../types';

function getCookie(name) {
  const cookies = Object.fromEntries(
    document.cookie
      .split('; ')
      .map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
  );
  extension.log(`aws-sso:getCookie:${name in cookies}`);
  return cookies[name];
}

function getToken(): string {
  const ssoKey = 'x-amz-sso_authn';
  return getCookie(ssoKey);
}

const RATE_LIMIT_RPS = 3;
export const RateLimiter = RateLimit(RATE_LIMIT_RPS);
export const Semaphore = new Sema(RATE_LIMIT_RPS);

// Controls how many times a request should be retried before it's deemed as failed.
const MAXIMUM_RETRIES = 3;

/**
 * Controls the exponential backoff strategy used between retries.
 * The final applied formula is then:
 *      BACKOFF_FACTOR ** TOTAL_ATTEMPTS_SO_FAR * BACKOFF_DELAY_IN_MS
 * eg:
 *  With BACKOFF_FACTOR=2 and BACKOFF_DELAY_IN_MS=200,
 *  requests will go out in the following timings:
 *      0ms   - initial request, failed with 429
 *      200ms - retry #1, fails with 429
 *      400ms - retry #2, fails with 429
 *      800ms - retry #3, fails with 429
 *          the request is then considered a failure
  */
const BACKOFF_FACTOR = 2;
const BACKOFF_DELAY_IN_MS = 200;

const fetchWithRetry = fetchRetry(fetch);

export default async function api<ResponseType = ApiData>(path: string): Promise<ResponseType> {
  extension.log(`aws-sso:api:${path}`);
  return fetchWithRetry(`${extension.ssoUrl}${path}`, {
    retries: MAXIMUM_RETRIES,

    retryDelay: (n) => BACKOFF_FACTOR ** n * BACKOFF_DELAY_IN_MS,

    // Retries on 429 (throttled) and 5xx errors
    retryOn: (n, err, res) => !!(res && (res.status === 429 || res.status >= 500)),
    headers: { 'x-amz-sso_bearer_token': getToken() },
  }).then(async (response) => {
    extension.log(`aws-sso:api:${path}:results`);
    return response.json() as ResponseType;
  });
}
