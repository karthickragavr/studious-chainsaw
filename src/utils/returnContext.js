// Where should "back" go from inside a game? Whoever LAUNCHES a game owns
// the answer: the lobby grid, the RPG world, the 2D map, or the missions
// page each set the context before navigating. Session-scoped so a refresh
// keeps it but a fresh tab starts clean.
const KEY = 'pm_return_ctx';

// Single-player game routes where a launch context applies. Multiplayer
// rooms keep their own leave flow (they return to their matchmaking lobby).
const GAME_PATHS = new Set([
    '/mangatha', '/blackjack', '/roulette', '/poker', '/slots', '/baccarat',
    '/rummy', '/sicbo', '/craps', '/hilo', '/teenpatti', '/keno',
]);

export const setReturnContext = (path, label) => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ path, label }));
    } catch { /* private mode — back falls through to lobby */ }
};

export const clearReturnContext = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};

export const getReturnContext = () => {
    try {
        const raw = sessionStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// Resolved back target for the current location. Only game routes honor the
// launch context — utility pages (wallet, stats…) always go home.
export const getBackTarget = (pathname) => {
    if (GAME_PATHS.has(pathname)) {
        const ctx = getReturnContext();
        if (ctx?.path) return { path: ctx.path, label: ctx.label || 'Back' };
    }
    return { path: '/', label: 'Lobby' };
};
