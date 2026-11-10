import type { Messages } from './ru'

const en: Messages = {
  app: {
    connecting: 'Connecting to Bastyon…',
    outside: {
      title: 'Barteron runs inside Bastyon',
      text: 'Open Barteron from the Services section of the Bastyon app.',
      open: 'Open in Bastyon',
    },
    failed: {
      title: 'Bastyon did not respond',
      script: 'Could not load the Bastyon SDK from {host}.',
      timeout: 'The SDK loaded, but Bastyon did not answer.',
      retry: 'Try again',
    },
  },
  status: {
    title: 'Barteron nextgen: scaffold',
    mode: 'Mode',
    modeBastyon: 'Inside Bastyon',
    modeMock: 'Mock SDK',
    host: 'Host',
    device: 'Device',
    network: 'Network',
    networkMain: 'main',
    networkTest: 'test',
    locale: 'Language',
    theme: 'Host theme',
    app: 'App ID',
    account: 'Account',
    accountGuest: 'You are not signed in to Bastyon',
    accountNoPermission: 'No access to the account',
    grant: 'Allow access',
    signIn: 'Sign in',
    routes: 'Route check',
  },
  stub: {
    title: 'The “{name}” screen comes in a later stage',
    params: 'Parameters',
    query: 'Link parameters',
    home: 'Home',
  },
  notFound: {
    title: 'Page not found',
    home: 'Home',
  },
}

export default en
