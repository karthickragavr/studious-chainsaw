import { useState, useCallback, useRef } from 'react';

// Field bet is a ONE-ROLL bet: it must be resolved on every roll,
// even when the pass-line round continues (point set / point missed).
const resolveField = (fieldBet, sum) => {
    if (!fieldBet) return 0;
    if (sum === 2 || sum === 12) return fieldBet * 3;
    if ([3, 4, 9, 10, 11].includes(sum)) return fieldBet * 2;
    return 0;
};

export const useCraps = () => {
    const [phase, setPhase] = useState('come-out'); // come-out | point | rolling | result
    const [dice, setDice] = useState([1, 1]);
    const [point, setPoint] = useState(null);
    const [bets, setBets] = useState({}); // { pass: n, field: n }
    const [lastWinnings, setLastWinnings] = useState(0);
    const [rollHistory, setRollHistory] = useState([]);
    // Field payout on a roll where the round continues — the component
    // credits this immediately since no result screen is shown.
    const [interimWin, setInterimWin] = useState(null); // { amount, sum } | null
    const timerRef = useRef(null);

    const placeBet = useCallback((betType, amount) => {
        // Pass line bets lock once a point is established
        if (betType === 'pass' && phase !== 'come-out') return false;
        if (phase === 'rolling' || phase === 'result') return false;

        setBets(prev => ({
            ...prev,
            [betType]: (prev[betType] || 0) + amount
        }));
        return true;
    }, [phase]);

    const clearBets = useCallback(() => {
        // The pass-line bet is contractually locked once the point is on
        if (phase === 'point') {
            setBets(prev => (prev.pass ? { pass: prev.pass } : {}));
        } else {
            setBets({});
        }
    }, [phase]);

    const getTotalBet = useCallback(() => {
        return Object.values(bets).reduce((sum, amt) => sum + amt, 0);
    }, [bets]);

    const roll = useCallback(() => {
        if (getTotalBet() === 0) return;

        const currentPhase = phase;
        const currentPoint = point;
        const currentBets = bets;
        setPhase('rolling');
        setInterimWin(null);

        const newDice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];
        const sum = newDice[0] + newDice[1];

        timerRef.current = setTimeout(() => {
            setDice(newDice);
            setRollHistory(prev => [sum, ...prev].slice(0, 10));

            const passBet = currentBets.pass || 0;
            const fieldWin = resolveField(currentBets.field, sum);

            let passResolved = false;
            let passWinnings = 0;

            if (currentPhase === 'come-out') {
                if (sum === 7 || sum === 11) {
                    passWinnings = passBet * 2;
                    passResolved = true;
                } else if (sum === 2 || sum === 3 || sum === 12) {
                    passResolved = true; // craps — pass loses
                } else {
                    setPoint(sum);
                }
            } else if (currentPhase === 'point') {
                if (sum === currentPoint) {
                    passWinnings = passBet * 2;
                    passResolved = true;
                } else if (sum === 7) {
                    passResolved = true; // seven-out
                }
            }

            if (passResolved) {
                setLastWinnings(passWinnings + fieldWin);
                setPoint(null);
                setPhase('result');
            } else {
                // Round continues: field bet comes off the table (won or lost)
                setBets(prev => (prev.pass ? { pass: prev.pass } : {}));
                if (fieldWin > 0) setInterimWin({ amount: fieldWin, sum });
                setPhase('point');
            }
        }, 1500);
    }, [phase, bets, point, getTotalBet]);

    const nextRound = useCallback(() => {
        setPhase('come-out');
        setBets({});
        setLastWinnings(0);
        setPoint(null);
        setInterimWin(null);
    }, []);

    const acknowledgeInterimWin = useCallback(() => setInterimWin(null), []);

    return {
        phase,
        dice,
        point,
        bets,
        lastWinnings,
        rollHistory,
        interimWin,
        placeBet,
        clearBets,
        getTotalBet,
        roll,
        nextRound,
        acknowledgeInterimWin,
    };
};
