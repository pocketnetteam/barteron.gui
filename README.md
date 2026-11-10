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

## Структура

```
build/        плагины Vite: dev-манифест, разрешённые origin хостов
e2e/          Playwright; fixtures/bastyon-sdk.js — копия sdk.js из pocketnet.gui
public/       b_manifest.json (production), иконки
src/components/  компоненты маркетплейса и раскладка (шапка, таб-бар)
src/i18n/     ru, en, sr
src/lib/      форматирование цен, контраст
src/router/   маршруты старого приложения
src/sdk/      связь с Bastyon
src/stores/   Pinia: сессия, тема
src/styles/   токены и базовые стили
src/ui/       базовые компоненты дизайн-системы, иконки
src/views/    экраны (пока заглушки); dev/ — витрина
```
