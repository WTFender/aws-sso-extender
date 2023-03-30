import extension from '../extension'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/strict-boolean-expressions
if (extension.ssoUrlRegex.test(window.location.href)) {
  extension.run()
}
