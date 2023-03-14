import extension from '../extension';

if (extension.config.ssoUrlRegex.test(window.location.href)) {
  extension.run();
}
