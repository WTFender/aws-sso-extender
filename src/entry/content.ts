import extension from '../extension';

const START_URL_REGEX = /^https:\/\/.+\.awsapps\.com\/start\/#\/$/;

if (START_URL_REGEX.test(window.location.href)) {
  extension.run();
}
