# Daily Quote Bank

An Expo Router TypeScript app for saving quotes, rotating a non-repeating daily quote, and delivering a local notification.

## Setup

```bash
npx create-expo-app@latest daily-quote-bank --template tabs
cd daily-quote-bank
# replace the generated files with this project, then:
npm install
npx expo start --web
# or
npx expo start --ios
npm test
```

The app is organized into `/app` (Expo Router screens) and `/src` (data, services, hooks, components, and tests). The notification scheduler is intentionally best-effort on web: a denied or unavailable browser permission leaves the UI usable without throwing. On native it schedules one repeating local notification and replaces the prior schedule when the time or bank changes.
