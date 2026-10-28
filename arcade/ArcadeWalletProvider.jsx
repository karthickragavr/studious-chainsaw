import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WalletContext } from '../src/context/walletContextObject';

// Play-money wallet for the public arcade. Same context shape as the main
// app's WalletProvider so every game component works unchanged, but it lives
// purely in this browser's localStorage — no profile, no Supabase sync.
// Uses its own storage keys so it never touches a signed-in player's wallet.
const BALANCE_KEY = 'arcade_wallet';
const TX_KEY = 'arcade_transactions';
// Stake of the round in progress, mirrored to storage so a reload or killed
// tab mid-round hands it back on the next launch instead of forfeiting it.
const AT_RISK_KEY = 'arcade_at_risk';
const MAX_TRANSACTIONS = 100;
export const STARTING_BALANCE = 1000;

const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode — session-only wallet */ }
};

const toSafeBalance = (value) => (Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : STARTING_BALANCE);

const clearAtRiskKey = () => {
    try { localStorage.removeItem(AT_RISK_KEY); } catch { /* private mode */ }
};

// Resolved once per page load (not per render): StrictMode runs state
// initializers twice, and the second run must not lose the refund.
let startup = null;
const getStartup = () => {
    if (startup) return startup;
    const base = toSafeBalance(readJSON(BALANCE_KEY, STARTING_BALANCE));
    const risk = readJSON(AT_RISK_KEY, null);
    const refund = Number.isFinite(risk?.amount) ? Math.max(0, Math.trunc(risk.amount)) : 0;
    if (refund > 0) writeJSON(BALANCE_KEY, base + refund);
    clearAtRiskKey();
    startup = { balance: base + refund, refund, game: risk?.game ?? null };
    return startup;
};

export const ArcadeWalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(() => getStartup().balance);
    const [transactions, setTransactions] = useState(() => {
        const saved = readJSON(TX_KEY, []);
        const list = Array.isArray(saved) ? saved : [];
        const { refund, game, balance: restored } = getStartup();
        if (refund <= 0) return list;
        const tx = { id: Date.now() + Math.random(), type: 'refund', amount: refund, game, balanceAfter: restored, timestamp: Date.now() };
        return [tx, ...list].slice(0, MAX_TRANSACTIONS);
    });
    const [lastChange, setLastChange] = useState(null);
    const balanceRef = useRef(balance);
    const atRiskRef = useRef({ amount: 0, game: null });

    useEffect(() => { writeJSON(BALANCE_KEY, balance); }, [balance]);
    useEffect(() => { writeJSON(TX_KEY, transactions); }, [transactions]);

    const addTransaction = useCallback((type, amount, game = null) => {
        const tx = { id: Date.now() + Math.random(), type, amount, game, balanceAfter: balanceRef.current, timestamp: Date.now() };
        setTransactions(prev => [tx, ...prev].slice(0, MAX_TRANSACTIONS));
    }, []);

    const applyDelta = useCallback((amount) => {
        const delta = Math.trunc(amount);
        if (!Number.isFinite(delta) || delta === 0) return;
        // Update the ref synchronously: a setState updater only runs at render
        // time, so back-to-back debits would otherwise all see the old balance.
        const next = Math.max(0, balanceRef.current + delta);
        balanceRef.current = next;
        setBalance(next);
        setLastChange({ amount: delta, at: Date.now() });
    }, []);

    const setExactBalance = useCallback((amount) => {
        const next = toSafeBalance(amount);
        balanceRef.current = next;
        setBalance(next);
    }, []);

    const debit = useCallback((amount, { type = 'loss', game = null } = {}) => {
        const value = Math.trunc(amount);
        if (!Number.isFinite(value) || value <= 0 || balanceRef.current < value) return false;
        applyDelta(-value);
        addTransaction(type, -value, game);
        return true;
    }, [applyDelta, addTransaction]);

    const credit = useCallback((amount, { type = 'win', game = null } = {}) => {
        const value = Math.trunc(amount);
        if (!Number.isFinite(value) || value <= 0) return false;
        applyDelta(value);
        addTransaction(type, value, game);
        return true;
    }, [applyDelta, addTransaction]);

    // Games report the stake they currently hold off the wallet. If the player
    // leaves mid-round (navigates away, reloads) that stake is returned.
    const setAtRisk = useCallback((amount, game = null) => {
        const value = Math.max(0, Math.trunc(Number(amount)) || 0);
        if (value === atRiskRef.current.amount) return;
        atRiskRef.current = { amount: value, game };
        if (value > 0) writeJSON(AT_RISK_KEY, { amount: value, game });
        else clearAtRiskKey();
    }, []);

    const refundAtRisk = useCallback(() => {
        const { amount, game } = atRiskRef.current;
        if (amount <= 0) return;
        atRiskRef.current = { amount: 0, game: null };
        clearAtRiskKey();
        applyDelta(amount);
        addTransaction('refund', amount, game);
    }, [applyDelta, addTransaction]);

    // Free play: topping back up to the starting stack is always allowed, so
    // a broke visitor is one click from playing again rather than locked out.
    const refill = useCallback(() => {
        const top = STARTING_BALANCE - balanceRef.current;
        if (top <= 0) return;
        applyDelta(top);
        addTransaction('refill', top, null);
    }, [applyDelta, addTransaction]);

    return (
        <WalletContext.Provider value={{
            balance,
            updateBalance: applyDelta,
            setExactBalance,
            addTransaction,
            transactions,
            debit,
            credit,
            lastChange,
            refill,
            setAtRisk,
            refundAtRisk,
        }}>
            {children}
        </WalletContext.Provider>
    );
};
