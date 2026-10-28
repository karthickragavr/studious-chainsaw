// Round history for the arcade, kept in this browser's localStorage so a
// visitor's record survives reloads and return visits without an account.
const KEY = 'arcade_bets';
const MAX_BETS = 500;
const CHANGED = 'arcade:bets-changed';

export const readBets = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
};

export const appendBet = (bet) => {
    const next = [bet, ...readBets()].slice(0, MAX_BETS);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode — not persisted */ }
    window.dispatchEvent(new Event(CHANGED));
    return next;
};

export const onBetsChanged = (listener) => {
    window.addEventListener(CHANGED, listener);
    return () => window.removeEventListener(CHANGED, listener);
};

// payout is the gross amount returned to the player, so net = payout - stake.
export const summarize = (bets) => {
    const rounds = bets.length;
    const wins = bets.filter(b => b.result === 'win').length;
    const net = bets.reduce((sum, b) => sum + (b.payout - b.bet_amount), 0);
    return { rounds, wins, winRate: rounds ? Math.round((wins / rounds) * 100) : 0, net };
};
