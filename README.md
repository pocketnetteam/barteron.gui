# Barteron nextgen

Новая версия мини-приложения Barteron для Bastyon. План работ и решения — в [PLAN.md](PLAN.md).

Стек: Vue 3, TypeScript, Vite, Pinia, vue-router, vue-i18n. Тесты — Vitest и Playwright. Пакеты — pnpm.

## Команды

```sh
pnpm install
pnpm dev          # http://localhost:5180, в обычном браузере — на заглушке SDK
pnpm dev:https    # https://localhost:5180 — для открытия внутри Bastyon
pnpm check        # типы, линтер, форматирование, unit-тесты
pnpm test:e2e     # Playwright: заглушка SDK и настоящий sdk.js в поддельном хосте
pnpm build        # production-сборка в dist/
pnpm build:test   # сборка для тестового стенда (SDK с test.pocketnet.app)
```

## Как приложение подключается к Bastyon

Bastyon открывает Barteron в iframe. Приложение загружает `https://<VITE_SDK_HOST>/js/lib/apps/sdk.js` и общается с хостом через `window.BastyonSdk`. Код — в [src/sdk/](src/sdk/):

- `types.ts` — типы методов SDK, которыми пользуется Barteron;
- `connect.ts` — загрузка sdk.js и рукопожатие с хостом (`appinfo`);
- `mock.ts` — заглушка SDK.

Заглушка включается, только если приложение открыто не в iframe и сборка это разрешает (`VITE_ALLOW_MOCK=true` — в dev и test). В production вне Bastyon приложение показывает «Откройте Barteron в Bastyon».

## Открыть внутри нового Bastyon (bastyon-nextgen)

1. `pnpm dev:https`.
2. Откройте https://localhost:5180 в том же браузере и примите самоподписанный сертификат. Без этого хост не сможет загрузить манифест.
3. В Bastyon: «Сервисы» → внизу «Для разработчиков: открыть своё приложение» → адрес `https://localhost:5180` → «Загрузить».

Почему так:

- **https.** CSP веб-версии bastyon-nextgen пускает фреймы и запросы только по https, поэтому http://localhost не загрузится.
- **Свой id.** Dev-сервер отдаёт манифест с id `barterondev.pocketnet.app`. Настоящий id `barteron.pocketnet.app` встроен в хост, и с другого адреса хост его не примет.
- **Без записи в сеть.** Методы `barteron.*` хост разрешает только настоящему id. Поэтому из dev-сборки записывать в сеть нельзя, только читать.

Без входа в аккаунт Bastyon приложение покажет «Вы не вошли в Bastyon». Если хост не дал доступ к аккаунту, будет кнопка «Разрешить доступ».

## Дизайн-система

Витрина компонентов — http://localhost:5180/dev/ui (`pnpm dev`). На ней три вкладки, по листам прототипа `foundations`, `components` и `marketplace`, и переключатели темы и языка. В production-сборку витрина не попадает: её включает `VITE_SHOWCASE=true` в `.env.development`, `.env.https` и `.env.test`.

- **Токены** — [src/styles/tokens.css](src/styles/tokens.css). Имена те же, что в макетах: `--page`, `--surface`, `--text2`, `--primary`… В компонентах и экранах используются только они, без цветов напрямую.
- **Тема** — [src/stores/theme.ts](src/stores/theme.ts): «Системная» (внутри Bastyon — тема хоста, вне его — тема ОС), «Светлая», «Тёмная». Выбор хранится в `localStorage`.
- **Базовые компоненты** — [src/ui/](src/ui/), имена с `Ui…`: кнопки, поля, выбор, вкладки, чипы, плашки, тосты (`showToast`), окна и листы, аватары, рейтинг, шаги.
- **Компоненты маркетплейса** — [src/components/](src/components/): карточки объявлений, цена, «Меняю на», продавец, статус сети и панель транзакции, шапка, таб-бар.
- **Иконки** — [src/ui/icons.ts](src/ui/icons.ts), сгенерированы из листа `foundations` и экранов. Показываются через `<UiIcon name="…" />`.

## Данные

Своего сервера у Barteron нет: всё читается из ноды через `sdk.rpc` хоста, а записывается транзакциями, которые подписывает Bastyon.

- **Модели** — [src/models/](src/models/): объявление (транзакция 211), профиль Barteron (104), отзыв и оценка, профиль Bastyon, дерево категорий. Каждая модель умеет разобрать транзакцию из ответа ноды и собрать то, что уходит в `sdk.barteron.*`. Формат — точно как у старого приложения: обе версии правят одни и те же объявления.
- **Запросы к ноде** — [src/api/barteron.ts](src/api/barteron.ts). Бан-лист применяется здесь же, к каждой выдаче.
- **Для экранов** — [src/api/queries.ts](src/api/queries.ts): `useFeed`, `useOffer`, `useAccount`, `useCategories`, `useRates` и другие (TanStack Query). Одиночные запросы карточек собираются в один запрос к ноде.
- **Транзакции** — [src/stores/tx.ts](src/stores/tx.ts): `send(kind, payload)` отправляет транзакцию и ведёт её статус: отправляем → ждём блок → в сети, при ошибке можно повторить.
- **Внешние сервисы** — курсы (coingecko, cryptocompare), адреса (Nominatim) и уведомления в Telegram и VK (p2p.back, [src/api/notify.ts](src/api/notify.ts)). Если хост включил Tor, запросы идут через его туннель: [public/miniapp-service-worker.js](public/miniapp-service-worker.js).

В обычном браузере заглушка SDK отвечает из сети в памяти: [src/sdk/mock-network.ts](src/sdk/mock-network.ts), демо-объявления — в [src/sdk/mock-data.ts](src/sdk/mock-data.ts). Блок приходит через 4 секунды. Если заголовок начинается с `!error`, нода отказывает сразу, а с `!reject` транзакция не попадает в блок. Посмотреть всё вместе можно на вкладке «Данные» витрины: http://localhost:5180/dev/ui/data. p2p.back на заглушке тоже в памяти ([src/sdk/mock-notify.ts](src/sdk/mock-notify.ts)): имя бота, начинающееся с `!error`, сервис не примет.

## Экраны

- **Главная** `/` — категории, подсказки, «Может подойти для обмена», «Вы смотрели», новые объявления.
- **Каталог и поиск** `/category/:id`, `/category/search?search=…` (все категории) — пути старого приложения. Фильтры записываются в адрес страницы: `price`, `exchange`, `mylist`, `condition`, `delivery`, `safedeal`, `free`. Модель фильтров — [src/models/filters.ts](src/models/filters.ts).
- **Карта** `/category/:id/map` — новый путь, тот же набор фильтров.
- **Объявление** `/barter/:id` — путь старого приложения. Одна страница для трёх случаев: чужое объявление, своё (с управлением и статусом сети) и пункт выдачи (категория 97). `?view=buyer` показывает своё объявление глазами покупателя. Код — [src/views/item/](src/views/item/) и [src/components/item/](src/components/item/); обмен, покупка и вопрос продавцу открывают чат Bastyon с теми же сообщениями, что и старое приложение ([src/composables/chat.ts](src/composables/chat.ts)).
- **Подача объявления** `/barter/create`, правка — `/barter/create/:id` и `/barter/edit/:id` (пути старого приложения). Мастер из пяти шагов, черновик хранится на устройстве. Пункт выдачи — тот же мастер с категорией 97. Предпросмотр черновика — `/barter/draft` (`?edit=<id>` при правке). Код — [src/views/create/](src/views/create/), [src/components/create/](src/components/create/), состояние формы — [src/composables/offer-form.ts](src/composables/offer-form.ts), перевод формы в транзакцию — [src/models/draft.ts](src/models/draft.ts).
- **Кабинет и профиль** `/profile/:id` — путь старого приложения. Свой адрес открывает кабинет, разделы — в хеше, как вкладки старого профиля: `#ads`, `#barters`, `#favorites`, `#votes`, и новые `#deals`, `#viewed`, `#wallet`, `#notifications`, `#settings`, `#mylist`, `#public` (свой профиль глазами других). Чужой адрес — публичный профиль продавца. На заглушке у пользователя и у демо-продавца Ильи есть роли гаранта и модератора. Код — [src/views/profile/](src/views/profile/), [src/components/cabinet/](src/components/cabinet/), запись профиля — [src/composables/my-account.ts](src/composables/my-account.ts).
- **Обмены** — раздел кабинета `#barters` (прямые обмены и цепочки по всем моим объявлениям), варианты для одного объявления `/barter/exchange/:id` и одна цепочка из трёх `/barter/search?source=…&target=…&via=…` — пути старого приложения. Подбор делает нода (`getbarterondeals`, `getbarteroncomplexdeals`); общий кеш на главную, своё объявление и кабинет — [src/composables/exchanges.ts](src/composables/exchanges.ts), правила — [src/models/exchange.ts](src/models/exchange.ts), экраны — [src/views/exchange/](src/views/exchange/) и [src/components/exchange/](src/components/exchange/). На заглушке у ноутбука пользователя один прямой обмен и одна цепочка через планшет Ильи.
- Остальные экраны — пока заглушки, они появятся на следующих этапах. Страница статуса подключения — `/dev/status`, только в dev- и test-сборках.

Каркас страницы — [src/components/layout/AppLayout.vue](src/components/layout/AppLayout.vue): шапка, подвал, таб-бар телефона и экраны поиска, категорий и места поверх страницы. Карта — Leaflet с плитками OpenStreetMap, грузится отдельным куском. На заглушке плиток нет, чтобы не ходить в сеть.

## Структура

```
build/        плагины Vite: dev-манифест, разрешённые origin хостов
e2e/          Playwright; fixtures/bastyon-sdk.js — копия sdk.js из pocketnet.gui
public/       b_manifest.json (production), иконки, Tor-туннель хоста, юридические документы
src/api/      запросы к ноде, курсы, адреса, уведомления (p2p.back); TanStack Query для экранов
src/components/  компоненты маркетплейса, каталога, главной, карты, объявления, формы подачи, кабинета, обменов; каркас страницы
src/composables/ выдача каталога, подбор обменов, поиск адреса, переходы, чат, страница объявления, форма подачи, кабинет, свой профиль, уведомления
src/config/   списки из старого приложения: бан-лист, гаранты, модераторы, пункты выдачи
src/data/     категории и их переводы (копия из старого приложения)
src/i18n/     ru, en, sr; каждый язык грузится отдельным куском
src/lib/      форматирование, очередь запросов, геохеш, область поиска, контраст, localStorage, сжатие фото, тексты ошибок ноды
src/models/   объявление, обмены и цепочки, черновик формы, профиль, отзыв, оценка, категории, фильтры каталога, доставка и пункты выдачи
src/router/   маршруты старого приложения
src/sdk/      связь с Bastyon; заглушка, сеть и p2p.back в памяти
src/stores/   Pinia: сессия, тема, язык, транзакции, валюта, место, избранное, просмотренные, история поиска, автопродление, напоминание об уведомлениях
src/styles/   токены и базовые стили
src/ui/       базовые компоненты дизайн-системы, иконки
src/views/    экраны: главная, каталог, карта, объявление (item/), подача (create/), кабинет и профиль (profile/), остальное пока заглушки; dev/ — витрина и статус
```
