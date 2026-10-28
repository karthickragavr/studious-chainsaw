import { useState, useEffect, useCallback } from 'react';
import { readBets, appendBet, onBetsChanged } from './betStore';

// Arcade build stand-in for src/hooks/useBetHistory.js: same API, but rounds
// are stored in localStorage instead of Supabase, so no account is needed.
export const useBetHistory = () => {
    const [bets, setBets] = useState(readBets);

    useEffect(() => onBetsChanged(() => setBets(readBets())), []);

    const logBet = useCallback(async (game, betAmount, result, payout, details = null) => {
        appendBet({
            id: Date.now() + Math.random(),
            game,
            bet_amount: betAmount,
            result,
            payout,
            details,
            created_at: new Date().toISOString(),
        });
    }, []);

    const fetchHistory = useCallback(async (limit = 50, gameFilter = null) => {
        setBets(readBets().filter(b => !gameFilter || b.game === gameFilter).slice(0, limit));
    }, []);

    return { bets, logBet, fetchHistory, loading: false };
};
