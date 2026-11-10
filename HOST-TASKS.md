# Правки в bastyon-nextgen для Barteron

Задание для того, кто работает в `C:\www\bastyon-nextgen`. Сам Barteron (`C:\www\barteron-nextgen`) этот репозиторий не правит. Нашли эти места при проверке Barteron в хосте 10.11.2026. Подробности — в [PLAN.md](PLAN.md), раздел 5, риски 6, 8 и 9.

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

## Не сейчас: запись из dev-сборки (риск 6)

Хост выполняет `barteron.*` только для id `barteron.pocketnet.app` (`assertBarteron` в `src/mini-apps/actions/barteron.ts`). С localhost Barteron поэтому может только читать. Решили 10.11.2026: пока запись в Barteron проверяется на заглушке SDK, хост не меняем. Когда понадобится живая проверка, выберем одно из двух:

- тестовый адрес (`tscope`) у встроенного Barteron и стенд в тестовой сети;
- настоящий id с localhost, только в dev-сборке хоста.
