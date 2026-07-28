# Quoted

An Expo Router + TypeScript iOS app for collecting quotes from famous authors, saving your favorites, and getting a non-repeating daily quote delivered as a local notification.

## Features

- Browse 240 quotes from 20 authors (with bios and photos) and save the ones you like to "My Bank"
- Quote of the Day banner that cycles through your saved quotes without repeating until all have been shown
- Share the quote of the day as an image, or copy any quote to the clipboard
- Organize saved quotes into custom collections and filter the bank by them
- Configurable daily notification time, plus optional additional notifications (1-5/day) at custom times
- Light/dark mode and adjustable text size, both persisted

## Tech stack

- Expo SDK 54 / Expo Router 6
- React Native 0.81, React 19
- TypeScript 5.9 (strict)
- AsyncStorage for local, on-device persistence (no backend)
- Jest + React Native Testing Library — 55 tests across 8 suites

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

- `app.json` declares `platforms: ["ios"]`. A `npm run web` script and the
  `react-native-web` dependency are still present from earlier development, but web is
  no longer a declared target and isn't covered by the test suite.
- Notification scheduling is best-effort: if permission is denied or the API is
  unavailable, the failure is swallowed so the UI stays usable. Notifications are
  rescheduled whenever the delivery time, quote of the day, or saved quotes change.
- All data (saved quotes, collections, and settings) lives in `AsyncStorage` on the
  device — there is no server or account system.
