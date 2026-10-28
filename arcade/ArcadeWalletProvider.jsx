import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WalletContext } from '../src/context/walletContextObject';

// Play-money wallet for the public arcade. Same context shape as the main
// app's WalletProvider so every game component works unchanged, but it lives
// purely in this browser's localStorage — no profile, no Supabase sync.
// Uses its own storage keys so it never touches a signed-in player's wallet.
const BALANCE_KEY = 'arcade_wallet';
const TX_KEY = 'arcade_transactions';
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

export const ArcadeWalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(() => toSafeBalance(readJSON(BALANCE_KEY, STARTING_BALANCE)));
    const [transactions, setTransactions] = useState(() => {
        const saved = readJSON(TX_KEY, []);
        return Array.isArray(saved) ? saved : [];
    });
    const [lastChange, setLastChange] = useState(null);
    const balanceRef = useRef(balance);

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
        }}>
            {children}
        </WalletContext.Provider>
    );
};
