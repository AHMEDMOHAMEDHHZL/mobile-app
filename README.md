# Sanayei Mobile

Mobile app scaffold for `صنايعي`, created with `Expo + React Native + TypeScript`.

## What is ready

- Root folder in project root: `mobile-app`
- Theme derived from the web color tokens in:
  - `front-end/Sanayei/src/assets/styles/variables.css`
- Shared backend connection through `EXPO_PUBLIC_API_BASE_URL`
- Secure auth storage using `expo-secure-store`
- React Query setup for API state
- Native stack navigation starter
- Branded starter Home and Login screens

## Run

```bash
npm start
```

Then use:

- `a` for Android
- `w` for web
- Expo Go on a physical device

## Environment

Copy `.env.example` to `.env` and set:

```bash
EXPO_PUBLIC_API_BASE_URL=https://sanay3i.net/api
```

For local backend testing, use your LAN IP instead of `localhost`.

Example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10/elsanaye3y-2/public/api
```

## Design notes

- Web color source is already mapped into `src/theme/colors.ts`.
- I did not find a Figma file inside the repository. If you have a Figma link or export outside the repo, add it to `docs/design-reference.md`.

## Suggested next steps

1. Add real auth endpoints for mobile login and me/profile hydration.
2. Port shared DTOs and API modules from the web app gradually.
3. Add store, services, and profile feature modules.
