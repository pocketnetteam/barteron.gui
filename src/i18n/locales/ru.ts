const ru = {
  app: {
    connecting: 'Подключаемся к Bastyon…',
    outside: {
      title: 'Barteron работает внутри Bastyon',
      text: 'Откройте Barteron в разделе «Сервисы» приложения Bastyon.',
      open: 'Открыть в Bastyon',
    },
    failed: {
      title: 'Bastyon не ответил',
      script: 'Не удалось загрузить SDK Bastyon с {host}.',
      timeout: 'SDK загрузился, но Bastyon не ответил на запрос.',
      retry: 'Повторить',
    },
  },
  status: {
    title: 'Barteron nextgen: каркас',
    mode: 'Режим',
    modeBastyon: 'Внутри Bastyon',
    modeMock: 'Заглушка SDK',
    host: 'Хост',
    device: 'Устройство',
    network: 'Сеть',
    networkMain: 'основная',
    networkTest: 'тестовая',
    locale: 'Язык',
    theme: 'Тема хоста',
    app: 'ID приложения',
    account: 'Аккаунт',
    accountGuest: 'Вы не вошли в Bastyon',
    accountNoPermission: 'Нет доступа к аккаунту',
    grant: 'Разрешить доступ',
    signIn: 'Войти',
    routes: 'Проверка маршрутов',
  },
  stub: {
    title: 'Экран «{name}» появится на следующих этапах',
    params: 'Параметры',
    query: 'Параметры ссылки',
    home: 'На главную',
  },
  notFound: {
    title: 'Страница не найдена',
    home: 'На главную',
  },
}

export type Messages = typeof ru
export default ru
