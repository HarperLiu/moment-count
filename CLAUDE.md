# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (LAN mode - phone must be on same WiFi)
npx expo start

# Start dev server (tunnel mode - works across networks)
npx expo start --tunnel

# Run on iOS simulator
npx expo run:ios

# Build for device via EAS
eas build --profile development --platform ios
```

### "Could not connect to development server" fix
- Phone and Mac must be on the same WiFi for LAN mode
- Use `npx expo start --tunnel` if on different networks (requires `@expo/ngrok`, already installed as dev dependency)
- Always run in terminal directly (not background) so the QR code is visible
- Scan the fresh QR code from the current session
- **TypeScript 版本**：Expo SDK 54 要求 TypeScript ≥ 5.0（`moduleResolution: "bundler"`、`customConditions` 等），如果 `package.json` 中 TypeScript 版本过低（如 4.x），需升级到 `^5.x`
- **expo-router 插件冲突**：本项目不使用 expo-router 做路由，但若 `app.json` 的 `plugins` 中包含 `"expo-router"`，会导致 Expo Go 无法连接或 bundle 失败（因为 `app/` 目录下的 `api.ts` 会被误识别为路由文件）。解决方法：从 `app.json` 的 `plugins` 和 `extra.router` 中移除 expo-router 相关配置
- 出现连接问题时，优先用 `npx expo start --clear` 清除 Metro 缓存后重试

## Architecture

This is a React Native app built with Expo for couples to track shared memories and cooking recipes.

### Navigation
The app uses **custom page-based routing via React state in `App.tsx`** — not expo-router（已从 `app.json` plugins 中移除，仅作为依赖保留）。 `currentPage` is a `PageKey` union type controlling which component renders. All page transitions happen via callbacks passed down from `App.tsx`.

### Key Files
- `App.tsx` — central hub: all app-level state, navigation logic, session bootstrap
- `app/api.ts` — REST API client with all type definitions and endpoint functions
- `styles/ThemeContext.tsx` — theme provider (light/dark/auto)
- `styles/theme.ts` — color tokens, radius, font values for both light/dark themes
- `components/` — all page and feature components (23 total)

### API Layer
All requests go to a Vercel-hosted REST server. The base URL is in `app/api.ts`. All responses use a `{ data: T }` envelope that the API functions unwrap automatically. The `@supabase/supabase-js` package is installed but not actively used — the REST API is the data layer.

### State & Persistence
No state management library. All shared state lives in `App.tsx` and is passed as props. Persistent state uses AsyncStorage with these keys:
- `user:uuid`, `user:profile`, `user:loginAt`, `user:linkedUser`, `user:linkId`, `user:themeMode`

Session is valid for 7 days from `user:loginAt`. On mount, `App.tsx` checks this and auto-logs in or redirects to welcome.

### Theme
All components consume theme via `useThemeContext()` hook. Dynamic styles are inline: `{ color: theme.colorForeground }`. Theme persists to AsyncStorage and responds to system color scheme when set to "auto".

### Native Modules
The app requires a **dev build** (not plain Expo Go) due to: `react-native-pdf`, `react-native-blob-util`, `react-native-maps`. A dev build must be installed on the device before connecting to Metro.
