# Quoted

An Expo Router + TypeScript iOS app for collecting quotes from famous authors, saving your favorites, and getting a non-repeating daily quote delivered as a local notification.

## Features

- Browse 504 quotes from 42 authors (with bios and photos) and save the ones you like to "My Bank"
- Every author is tagged with 3-8 themes (stoicism, resilience, humor, ...) from a fixed vocabulary; filter the author list by theme, or search for one by name
- Quote of the Day banner that cycles through your saved quotes without repeating until all have been shown
- Share any quote as an image — from the banner, the bank, an author page, or your history — or copy it to the clipboard
- Write your own quotes with your own attribution and themes; they join the same rotation, collections, and notifications as saved ones
- Organize saved quotes into custom collections and filter the bank by them
- Scope delivery to a single collection or a single theme, so only those quotes are sent
- Filter your bank by theme as well as by collection, or search it by theme name
- Quote history showing what has already been delivered, up to 21 days back, with delivery streaks and cycle progress
- Tapping a notification opens the app on the quote that was delivered
- Configurable daily notification time, plus optional additional notifications (1-5/day), each with its own time and its own collection or theme to draw from
- Light/dark/system appearance and adjustable text size, both persisted, under one Display setting
- Settings reports how far ahead quotes are queued, and a reminder fires if the run lapses

## Tech stack

- Expo SDK 54 / Expo Router 6
- React Native 0.81, React 19
- TypeScript 5.9 (strict)
- AsyncStorage for local, on-device persistence (no backend)
- Jest + React Native Testing Library — 307 tests across 19 suites

## Project structure

```
app/                    Expo Router screens (tabs: Quote Bank, Authors, Settings)
src/components/         Shared UI components (QuoteCard, CollectionModal)
src/data/               Static author/quote data and author photos
src/hooks/              React context providers (quote bank state, theme)
src/services/           Storage, notification scheduling, queue management
src/test-utils.tsx      Shared test render helpers
src/types.ts            Shared TypeScript types
src/__tests__/          Screen-level integration tests
src/services/__tests__/ Unit tests for services
```

## Setup

### Prerequisites

- Node.js 20.19.4+ and npm (Metro, the bundler Expo SDK 54 ships, requires it)
- A Mac with Xcode + iOS Simulator, or the Expo Go app on a physical iOS device
- No backend or account setup is required — all data is stored locally on-device

### Install

```bash
git clone <repo-url>
cd Quoted
npm install
```

### Run

```bash
npm start       # Expo dev server — scan the QR code with Expo Go, or press i
npm run ios     # open directly in the iOS Simulator
```

### Test

```bash
npm test           # run the Jest suite once
npm run test:watch # re-run on change
npx tsc --noEmit   # typecheck
```

## Building with EAS

`eas.json` defines `development`, `preview`, and `production` iOS profiles. Before your
first build, replace these placeholders:

| File | Key | Value |
| --- | --- | --- |
| `app.json` | `ios.bundleIdentifier` | your reverse-DNS bundle ID, e.g. `com.example.quoted` |
| `eas.json` | `submit.production.ios.appleId` | your Apple ID email |
| `eas.json` | `submit.production.ios.ascAppId` | your App Store Connect app ID |

```bash
npx eas build --profile preview --platform ios
```

## Notes

- `app.json` declares `platforms: ["ios"]`, and nothing web-related survives: the
  `react-native-web`/`react-dom` dependencies, the `npm run web` script, and the web
  branch of the notification permission check are all gone.
- iPad is supported (`ios.supportsTablet`). Rather than letting the layout go full-bleed,
  every screen's content container is held to `CONTENT_MAX_WIDTH` by the shared `measure`
  style in `src/theme.ts` — a quote set across a 12.9" screen is a line long enough to lose
  your place in. Backgrounds stay on the scroll view so only the text is inset, which is why
  the two screens that painted their background on the content container
  (`authors/index`, `authors/[authorId]`) needed a wrapper.
- Notification scheduling is best-effort: if permission is denied or the API is
  unavailable, the failure is swallowed so the UI stays usable. Notifications are
  rescheduled whenever the delivery time, quote of the day, or saved quotes change.
- The rotation is written to the OS in advance and only ever extended when the app is
  launched, so a user who stops opening it stops receiving quotes — after 14 days with no
  extras, and sooner once the 60-notification budget is split across extra slots. That used
  to happen silently and permanently. Now one slot of the budget is reserved for a reminder
  scheduled on the first uncovered morning ("Your quotes have paused"), and `Daily delivery`
  reports the runway it is working with. The reminder follows the day the scheduler actually
  reached, not the horizon it was asked for, so a truncated plan is still covered.
- All data (saved quotes, collections, and settings) lives in `AsyncStorage` on the
  device — there is no server or account system.
- **There is no backup or export.** Quotes you write yourself are the only data that
  cannot be recovered from the built-in catalogue, and `Clear all data` destroys them,
  as does uninstalling the app. A deleted quote can be restored only within the
  six-second undo window.
- Quote history is derived from the day-assignment records the scheduler already keeps,
  so it shows only quotes still in your bank, and emptying the bank clears it. Streaks are
  counted from those same records but from the *days* rather than the quotes, so deleting a
  quote does not punch a hole in a run you actually received. Both streak figures are bounded
  by the 21 days of assignments retained.
- Scoping delivery to a collection falls back to the whole bank if that collection is deleted
  or holds none of your saved quotes — silently delivering nothing would be the worse failure.
  The settings screen says when the fallback is in effect.
- Each extra notification slot can draw from its own collection, defaulting to "same as daily"
  rather than to the whole bank, so narrowing the daily scope narrows the extras with it. The
  no-repeat cycle is shared across every pool — a quote sent as an extra is not repeated as the
  daily one — but exhausting one pool clears only that pool's progress, so a small collection on
  an extra slot cannot reset the whole bank's rotation every few days.
- Some authors have no photo yet and render as an initial instead. Adding one means dropping the
  image at `assets/authors/<id>.jpg` and registering it in `src/data/authorPhotos.ts`; Metro
  cannot resolve a dynamic `require`, so the map has to be written out by hand.
- Quotes are picked for provenance: each traces to a named work, or to an ancient source that
  attributes it directly. Several very famous lines are deliberately absent because they belong
  to someone else — "we are what we repeatedly do" is Will Durant paraphrasing Aristotle,
  "between stimulus and response there is a space" is Stephen Covey rather than Frankl, and
  "a goal without a plan is just a wish" appears nowhere in Saint-Exupéry. Popularity is not
  evidence; if a line cannot be placed in a work, it does not go in.
- Appearance defaults to Light rather than System. The palette is a deliberately warm
  cream-and-chocolate one, and a dark-mode phone should not meet the inverted version of it on
  first launch. System remains an option in settings.
- Themes are tagged per author rather than per quote, so a built-in quote inherits its
  author's themes — 500 individually-tagged quotes would be a judgement call each rather
  than a fact about the writer. Quotes you write yourself are the exception: a `custom:`
  authorId has no author record to inherit from, so they carry their own tags, set in the
  compose sheet. `themesForQuote` is the one place that resolves the two, preferring the
  quote's own. `src/data/themes.ts` is the closed vocabulary; adding a tag outside it is a
  type error.
- Theme filters and theme scopes are offered only for themes something in the bank actually
  carries (`themesInBank`). A chip for a theme nobody has saved could only ever empty the
  list, or — as a delivery scope — deliver nothing and fall straight back to the whole bank.
- Delivery scope is a `DeliveryScope` discriminated union (`all` / `collection` / `theme`)
  rather than the nullable collection id it started as. `deliveryPool` is the single place
  that resolves one to quotes, so a new variant means teaching one function. The same type
  drives each extra slot, where `null` still means "follow the daily scope". Two migrations
  run on read: `@quote-bank/delivery-collection` held a bare collection id, and extra-slot
  settings held a `collectionIds` array of them; both lift into collection scopes, and the
  old delivery key is deleted the next time a scope is set.
- The theme fallback matches the collection one: a scope nothing carries widens back to the
  whole bank, and settings says so. Silently delivering nothing would be the worse failure.
