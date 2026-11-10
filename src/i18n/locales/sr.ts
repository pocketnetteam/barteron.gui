import type { Messages } from './ru'

const sr: Messages = {
  app: {
    connecting: 'Повезујемо се са Bastyon-ом…',
    outside: {
      title: 'Barteron ради унутар Bastyon-а',
      text: 'Отворите Barteron у одељку „Сервиси“ апликације Bastyon.',
      open: 'Отвори у Bastyon-у',
    },
    failed: {
      title: 'Bastyon није одговорио',
      script: 'Није успело учитавање Bastyon SDK са {host}.',
      timeout: 'SDK се учитао, али Bastyon није одговорио на захтев.',
      retry: 'Покушај поново',
    },
  },
  status: {
    title: 'Barteron nextgen: костур',
    mode: 'Режим',
    modeBastyon: 'Унутар Bastyon-а',
    modeMock: 'SDK симулатор',
    host: 'Хост',
    device: 'Уређај',
    network: 'Мрежа',
    networkMain: 'главна',
    networkTest: 'тестна',
    locale: 'Језик',
    theme: 'Тема хоста',
    app: 'ID апликације',
    account: 'Налог',
    accountGuest: 'Нисте пријављени у Bastyon',
    accountNoPermission: 'Нема приступа налогу',
    grant: 'Дозволи приступ',
    signIn: 'Пријави се',
    routes: 'Провера рута',
  },
  stub: {
    title: 'Екран „{name}“ стиже у једној од следећих фаза',
    params: 'Параметри',
    query: 'Параметри линка',
    home: 'Почетна',
  },
  notFound: {
    title: 'Страница није пронађена',
    home: 'Почетна',
  },
}

export default sr
