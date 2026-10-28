import { useState, useCallback } from 'react';

const isTriple = (dice) => dice[0] === dice[1] && dice[1] === dice[2];
const getSum = (dice) => dice[0] + dice[1] + dice[2];

export const useSicBo = () => {
    const [phase, setPhase] = useState('betting'); // betting, rolling, result
    const [dice, setDice] = useState(null); // [num, num, num]
    const [bets, setBets] = useState({}); // { betType: amount }

    const placeBet = useCallback((betType, amount) => {
        setBets(prev => ({
            ...prev,
            [betType]: (prev[betType] || 0) + amount
        }));
    }, []);

    const removeBet = useCallback((betType) => {
        setBets(prev => {
            const next = { ...prev };
            delete next[betType];
            return next;
        });
    }, []);

    const clearBets = useCallback(() => {
        setBets({});
    }, []);

    const getTotalBet = useCallback(() => {
        return Object.values(bets).reduce((sum, amt) => sum + amt, 0);
    }, [bets]);

    const roll = useCallback(() => {
        if (phase !== 'betting' || Object.keys(bets).length === 0) return;
        setPhase('rolling');

        // Roll animation delay
        setTimeout(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const d3 = Math.floor(Math.random() * 6) + 1;
            setDice([d1, d2, d3]);
            setPhase('result');
        }, 3000);
    }, [phase, bets]);

    const calculateWinnings = useCallback(() => {
        if (!dice) return 0;
        let winnings = 0;
        const sum = getSum(dice);
        const triple = isTriple(dice);
        const counts = Array(7).fill(0);
        dice.forEach(d => counts[d]++);

        Object.entries(bets).forEach(([betType, amount]) => {
            if (betType === 'small') {
                if (sum >= 4 && sum <= 10 && !triple) winnings += amount * 2;
            } else if (betType === 'big') {
                if (sum >= 11 && sum <= 17 && !triple) winnings += amount * 2;
            } else if (betType === 'any-triple') {
                if (triple) winnings += amount * 31; // 30:1 + original
            } else if (betType.startsWith('triple-')) {
                const target = parseInt(betType.split('-')[1], 10);
                if (triple && dice[0] === target) winnings += amount * 181;
            } else if (betType.startsWith('double-')) {
                const target = parseInt(betType.split('-')[1], 10);
                if (counts[target] >= 2) winnings += amount * 11;
            } else if (betType.startsWith('sum-')) {
                const target = parseInt(betType.split('-')[1], 10);
                if (sum === target) {
                    if (target === 4 || target === 17) winnings += amount * 61;
                    else if (target === 5 || target === 16) winnings += amount * 31;
                    else if (target === 6 || target === 15) winnings += amount * 19; // 18:1
                    else if (target === 7 || target === 14) winnings += amount * 13;
                    else if (target === 8 || target === 13) winnings += amount * 9;
                    else if (target >= 9 && target <= 12) winnings += amount * 7;
                }
            } else if (betType.startsWith('single-')) {
                const target = parseInt(betType.split('-')[1], 10);
                if (counts[target] === 1) winnings += amount * 2;
                else if (counts[target] === 2) winnings += amount * 3;
                else if (counts[target] === 3) winnings += amount * 4;
            }
        });

        return winnings;
    }, [dice, bets]);

    const resetGame = useCallback(() => {
        setDice(null);
        setBets({});
        setPhase('betting');
    }, []);

    return {
        phase,
        dice,
        bets,
        placeBet,
        removeBet,
        clearBets,
        getTotalBet,
        roll,
        calculateWinnings,
        resetGame,
    };
};
