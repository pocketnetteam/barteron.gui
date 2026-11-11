# Правки в bastyon-nextgen для Barteron

Задание для того, кто работает в `C:\www\bastyon-nextgen`. Сам Barteron (`C:\www\barteron-nextgen`) этот репозиторий не правит. Нашли эти места при проверке Barteron в хосте 10.11.2026 (п. 1–5) и 11.11.2026 (п. 6–7). Подробности — в [PLAN.md](PLAN.md), раздел 5, риски 6, 8 и 9.

Пути ниже — от корня bastyon-nextgen.

## 1. Скрыть нижнюю панель, пока открыто мини-приложение

**Что не так.** На телефоне и планшете рамка мини-приложения занимает весь экран (`SC_Frame`: `position: fixed; inset: 0`, `src/mini-apps/ui/mini-app-frame.styled.ts`). Нижняя панель хоста (`BottomNav`, `z-index: 1000`) лежит поверх рамки и закрывает нижние 50 px приложения. У Barteron там свой таб-бар: «Поиск», «Избранное», «Разместить», «Обмены», «Профиль».

**Решение.** Пока открыт маршрут `mini-app` (`/app/:appId/:innerPath(.*)?`, `src/router/index.ts`), хост не показывает нижнюю панель. Так сделано у мини-приложений в Telegram. Выйти можно «лепестком» закрытия.

**Где.** В `src/b-components/app-layout/app-layout.vue`:

- строка 15: `<BottomNav v-if="isMobileOrTablet" />`;
- строка 10: класс `has-bottom-nav` у `SC_Appcnt`.

В обоих местах условие — `isMobileOrTablet && route.name !== 'mini-app'`.

**Проверить:**

- Сервисы → Barteron на ширине 390: внизу виден таб-бар Barteron, панели хоста нет;
- «лепесток» закрывает приложение, и панель хоста возвращается;
- чат, открытый из приложения (`sdk.chat`), закрывается своей кнопкой (`SC_CloseOverlayButton` в `messenger-wrapper.vue`), и пользователь возвращается в приложение;
- кнопка «назад» на Android и в Tauri ведёт из приложения туда же, куда «лепесток»;
- остальные страницы хоста на телефоне выглядят как раньше.

## 2. Сообщить приложению, где лежит «лепесток»

**Что не так.** «Лепесток» закрытия (`SC_ClosePetal`, тот же файл) лежит поверх приложения: `top: 16px`, `right: 0`, высота 28 px, в свёрнутом виде 34 px в ширину. На телефоне он закрывает кнопки в правом верхнем углу шапки Barteron: колокольчик на главной и кнопку места в каталоге. Сейчас приложение не может узнать, что угол занят: в `appinfo` есть только `margintop`.

**Решение.** В ответ `appinfo` (`src/mini-apps/actions/helpers.ts`, строки 20–38) добавить поле с прямоугольником «лепестка» в CSS-пикселях относительно рамки, например:

```ts
closebutton: { side: 'right', top: 16, width: 34, height: 28 }
```

Если «лепестка» нет, поля нет. Barteron будет держать свои кнопки за пределами этого прямоугольника. Прежний хост поле не присылает, там ничего не меняется.

Если удобнее другой формат — подойдёт любой, но напишите в этот файл, какой выбрали: Barteron подстроится.

**Проверить:** тест в `src/mini-apps/actions/helpers.test.ts` рядом с проверкой `margintop`.

## 3. Разрешить встроенному Barteron внешние адреса для Tor-туннеля

**Что не так.** При включённом Tor хост пускает внешние запросы мини-приложения только к адресам из `fetchHosts`. У встроенного Barteron (`src/mini-apps/registry/built-in.ts`, строки 58–67) этого поля нет, а `fetch_hosts` из манифеста встроенному приложению список не заменяет. Поэтому с Tor у Barteron не грузятся курсы валют, поиск адресов, плитки карты и уведомления. Без Tor всё работает.

**Решение.** Добавить в запись `barteron.pocketnet.app` (поле уже описано в типе `BuiltInApp`, строка 38):

```ts
fetchHosts: [
  'https://api.coingecko.com',
  'https://min-api.cryptocompare.com',
  'https://nominatim.openstreetmap.org',
  'https://tile.openstreetmap.org',
  'https://p2p.back.pocketnet.app',
],
```

Это тот же список, что в `fetch_hosts` манифеста Barteron (`public/b_manifest.json`).

**Проверить:**

- `src/mini-apps/store/apps-installer.test.ts`: у встроенного Barteron `manifest.fetchHosts` содержит `https://barteron.club` и эти пять адресов;
- вручную с Tor: в Barteron открываются курсы, «Где искать» с поиском адреса и карта с плитками.

## 4. `open.profile` с типом `username`

**Что не так.** Старый Barteron, который сейчас открывается в bastyon-nextgen с barteron.club, открывает профиль продавца вызовом `sdk.open.profile('username', <имя>)` (barteron.gui `src/js/sdk.js`, `openBastyonProfile`). Прежний хост принимает типы `username` и `address` (pocketnet.gui `js/lib/apps/index.js`, `open.profile`). bastyon-nextgen принимает только `address` и `name` и на `username` бросает `open_profile_invalid_type` (`src/mini-apps/actions/content.ts`, строки 64–80). Поэтому кнопка «Профиль в Bastyon» у старого Barteron в новом хосте не работает.

**Решение.** Принимать `username` так же, как `name`.

**Проверить:** тест рядом с проверками `open.profile`: `{ type: 'username', data: 'alice' }` открывает профиль `alice`.

Новый Barteron вызывает сначала `username`, а при ошибке — `address`, так что работает в обоих хостах и без этой правки.

## 5. `open.wallet`: открыть кошелёк Bastyon

**Что не так.** В кабинете Barteron есть раздел «Кошелёк» (макет `s5-wallet-desktop`): баланс и кнопки «Пополнить в Bastyon ↗» и «История операций ↗». Открыть свой кошелёк мини-приложение не может: среди действий хоста есть `open.post`, `open.donation` и `open.profile` (`src/mini-apps/actions/content.ts`), а кошелька нет. Прежний хост такого действия тоже не знает. Ссылка наружу не годится: у bastyon-nextgen кошелёк на `/wallets`, у прежнего Bastyon — на `/wallet`, и в приложении для телефона она откроется в браузере, где пользователь не вошёл.

**Решение.** Действие `open.wallet` без разрешений: переводит хост на страницу кошелька (`/wallets`, маршрут `wallets` в `src/router/index.ts`) и сворачивает мини-приложение так же, как `open.profile`. Необязательный параметр `section`: `topup` — сразу к пополнению, `history` — к истории. В `sdk.js`, который хост отдаёт приложениям, — метод `open.wallet(section?)` рядом с `open.profile`.

**Как Barteron это использует.** Кнопки показываются, только если у SDK есть `open.wallet` (`src/components/cabinet/WalletSection.vue`). Пока его нет, в разделе только баланс и подпись «Пополнение, переводы и история — в приложении Bastyon».

**Проверить:** тест рядом с проверками `open.profile`: `open.wallet` с `{}` и с `{ section: 'history' }` открывает страницу кошелька.

## 6. `get.fromToTransactions`: метка OP_RETURN и порядок параметров

**Что не так.** Старый Barteron, который сейчас открывается в bastyon-nextgen с barteron.club, узнаёт статус безопасной сделки так: `sdk.get.fromToTransactions(от, кому, { update: true, depth: 3466240, opreturn: '<hex скрипта OP_RETURN>', confirmations: 6 })` (barteron.gui `src/views/Barter/SafeDeal/content/index.js`, `updateStatus`). В bastyon-nextgen это действие для него не работает, по двум причинам:

- схема (`src/mini-apps/actions/_schema.ts`, `fromToTransactions`) описывает `opreturn` как `z.boolean()`, а приходит строка. Запрос отклоняется с `invalid_params`;
- обработчик (`src/mini-apps/actions/wallet.ts`) передаёт ноде `[addressFrom, addressTo, update, depth, opreturn]`. Нода ждёт `[от, кому, с высоты, метки]` (pocketnet.core `PocketTransactionRpc.cpp`, `GetFromToTransactions`; так же зовёт прежний хост, pocketnet.gui `js/satolist.js`, `getfromtotransactions`). `update` — флаг кеша прежнего клиента, ноде его не передают. Сейчас на месте высоты оказывается `update`, высота уходит на место метки, а сама метка — пятым параметром. Нода её не видит и ищет переводы по своей метке по умолчанию, `a:subscription`.

Тест `calls RPC with correct legacy parameters` в `wallet.test.ts` закрепляет этот неверный порядок.

**Решение.** В схеме `opreturn: z.union([z.string(), z.array(z.string())]).optional()`. В обработчике — `[addressFrom, addressTo, depth, opreturn]`, а `depth`, если его нет, — как у прежнего хоста: текущая высота минус 43 200 × 12 блоков. `update` ноде не передавать.

**Как Barteron это использует.** Новый Barteron статус сделки через это действие не читает: он спрашивает `sdk.rpc('getfromtotransactions', [от, кому, 3466240, скрипт])` и высоту `sdk.rpc('getnodeinfo')`. Оба метода хост пропускает (`rpc-spec.ts`). Проверено 11.11.2026 на основной сети через свою копию bastyon-nextgen, без входа: высота пришла; по выдуманной сделке — пустой список; по метке `a:subscription`, переданной строкой, — 27 переводов за месяц. Правка нужна старому Barteron, пока он открывается в новом хосте, и другим приложениям с этим действием.

**Проверить:** тест в `wallet.test.ts`: `{ addressFrom: 'A', addressTo: 'B', update: true, depth: 10, opreturn: '6a24…' }` → RPC `['A', 'B', 10, '6a24…']`.

## 7. `openExternalLink`: письмо в поддержку (`mailto:`)

**Что не так.** В Barteron есть окно «Написать в поддержку» (макет `s8-dialogs`) с кнопкой «Написать письмо ↗»: `sdk.openExternalLink('mailto:support@bastyon.com?subject=…')`. bastyon-nextgen отклоняет такую ссылку с `invalid_params`: в схеме действия (`src/mini-apps/actions/_schema.ts`, `openExternalLink: z.object({ url: SafeUrl })`) `SafeUrl` пропускает только `http(s)`. При этом сам хост `mailto:` открыть умеет: `ALLOWED_PROTOCOLS` в `src/helpers/common/open-external.ts` — `http:`, `https:`, `mailto:`. Прежний хост открывает любую ссылку (`window.open`, InAppBrowser, `shell.openExternal`), и письмо там открывается.

**Решение.** Для `openExternalLink` принимать, кроме `http(s)`, ещё `mailto:` — ту же тройку схем, что в `ALLOWED_PROTOCOLS`. `javascript:`, `data:`, `file:` по-прежнему отклонять. `authFetch` оставить на `SafeUrl`.

**Как Barteron это использует.** Если хост отказал, Barteron копирует адрес и пишет «Bastyon не открыл почту. Адрес support@bastyon.com скопирован». Кнопка «Скопировать адрес почты» работает в обоих хостах и без этой правки.

**Проверить:** тест в `_schema.test.ts` или `content.test.ts`: `{ url: 'mailto:support@bastyon.com?subject=Barteron' }` принимается, `{ url: 'javascript:alert(1)' }` — нет.

## Не сейчас: запись из dev-сборки (риск 6)

Хост выполняет `barteron.*` только для id `barteron.pocketnet.app` (`assertBarteron` в `src/mini-apps/actions/barteron.ts`). С localhost Barteron поэтому может только читать. Решили 10.11.2026: пока запись в Barteron проверяется на заглушке SDK, хост не меняем. Когда понадобится живая проверка, выберем одно из двух:

- тестовый адрес (`tscope`) у встроенного Barteron и стенд в тестовой сети;
- настоящий id с localhost, только в dev-сборке хоста.
