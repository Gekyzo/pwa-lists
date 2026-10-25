# Account

The account and the approval gate. The server is the PocketBase server of `pwa-server`: one
account serves every app, and the administrator approves access per app. The app talks to it
with `fetch`, with no SDK. The lists stay on the device: nothing syncs. The user picks one of
two ways in: **Continuar con Google**, or **Usar sin conexión** with no account.

## Rules

- **ACC-1** The start routes by the saved session, then by the offline flag (ACC-10): a session
  that is not approved opens **Esperando aprobación**; an approved session opens the app; no
  session and the flag opens the app; no session and no flag opens **Iniciar sesión**. The route
  never reads the clock.
- **ACC-2** **Iniciar sesión** has the app icon, the title, one line of text, **Continuar con
  Google** and **Usar sin conexión**. **Esperando aprobación** has **Comprobar de nuevo** and
  **Cerrar sesión**. Both cover the whole app, the walkthrough too. **Usar sin conexión** closes
  **Iniciar sesión** (ACC-10); with the offline flag set, `Escape` closes it too. Else `Escape`
  does nothing while one is open. An error shows below the button: `account.error.google`,
  `account.error.network` or `account.error.tooMany`. A button waits for its request, so a second
  tap sends nothing.
- **ACC-3** "Approved" is the `app_access` row of the app `pwa-lists` (`APP_SLUG` of
  `src/config.js`) with the status `approved`. Each sign-in and each refresh reads it. With no
  row, the app creates a `pending` one; a duplicate row that another device made meanwhile is
  read again. The server URL is `http://localhost:8090` on a local host, else
  `https://artisandevs.duckdns.org`.
- **ACC-4** Google sign-in is a redirect. The app asks the server for the URL of the provider,
  keeps the state and the verifier in `sessionStorage` (`lists.oauth`), and sends the browser
  there with the URL of the app as the return address. On return the app removes `code`, `state`
  and `error` from the URL at once and keeps each other parameter. A return with no `code` (a
  cancel at Google), with no pending sign-in or with another `state` shows **Iniciar sesión** with
  `account.error.google`.
- **ACC-5** The session, the token and the user, is stored in `lists.session`.
- **ACC-6** At the start when online, and at the `online` event, the app refreshes a saved
  session. An approved session keeps the app open; a session that is no longer approved opens
  **Esperando aprobación**; an auth error removes the session and opens **Iniciar sesión**. A
  network or server error changes nothing. A logout during the request makes the answer save
  nothing.
- **ACC-7** **Comprobar de nuevo** refreshes the session as ACC-6. A session that is still not
  approved shows the toast `account.waiting.still`.
- **ACC-8** `Ajustes` has the group **Cuenta**: with a session, the email and **Cerrar sesión**;
  with none, **Iniciar sesión con Google**, which opens **Iniciar sesión**. **Cerrar sesión**
  removes the session only; the lists and the preferences stay. It then routes as ACC-1: with the
  offline flag the app stays open, else **Iniciar sesión** shows.
- **ACC-9** With no `localStorage` the app shows no account screen and works as before.
- **ACC-10** The offline flag is `lists.offline` = `1` in `localStorage`. **Usar sin conexión**
  writes it; an approved session that opens the app removes it. A storage that refuses the write
  still opens the app for this start.

## Set-up outside the app

- The server has a row in `apps`: slug `pwa-lists`, url `https://gekyzo.github.io/pwa-lists/`.
- The Google OAuth client has the redirect URIs `https://gekyzo.github.io/pwa-lists/` and
  `http://localhost:8080/` (`npm run serve`).
