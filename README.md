# studious-chainsaw — PlayMangatha Arcade

12 single-player casino games in the browser: Mangatha, Blackjack, Roulette,
Video Poker, Slots, Baccarat, Gin Rummy, Sic Bo, Craps, Hi-Lo, Teen Patti and
Keno. No sign-up and no backend. Play money only; chips and round history
are saved in the visitor's browser (localStorage).

## Run

```bash
npm install
npm run dev       # http://localhost:5175
npm run build     # static site in dist/
npm run preview
```

Render static site: build command `npm install && npm run build`,
publish directory `dist`.

## Layout

- `arcade/` — the arcade app: lobby, header, play-money wallet, and the
  localStorage bet history (`arcade/local/`).
- `src/` — game components, hooks and styles, copied unchanged from
  [play-mangatha](https://github.com/karthickragavr/play-mangatha). Only the
  files the arcade imports are here.
- `vite.config.js` — swaps play-mangatha's Supabase hooks for the local ones
  (`useBetHistory` → `arcade/local/`, `useAchievements` → `arcade/stubs/`).

## Syncing from play-mangatha

The games are developed in play-mangatha. To pick up changes, copy the same
paths over (`arcade/` and the `src/` files present here). Do not copy
`src/hooks/useBetHistory.js` or `src/hooks/useAchievements.jsx`: they need
Supabase, and the aliases in `vite.config.js` replace them.
