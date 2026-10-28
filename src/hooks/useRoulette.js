import { useState, useCallback, useRef } from 'react';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// European roulette wheel order
const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
    11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
    22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const getNumberColor = (n) => {
    if (n === 0) return 'green';
    return RED_NUMBERS.includes(n) ? 'red' : 'black';
};

export const useRoulette = () => {
    const [phase, setPhase] = useState('betting'); // betting, spinning, result  
    const [result, setResult] = useState(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [bets, setBets] = useState({}); // { betType: amount }
    const angleRef = useRef(0);

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

    const spin = useCallback(() => {
        if (phase !== 'betting' || Object.keys(bets).length === 0) return;
        setPhase('spinning');

        const winningNumber = Math.floor(Math.random() * 37); // 0-36
        const winIndex = WHEEL_ORDER.indexOf(winningNumber);
        const sliceAngle = 360 / 37;
        // The wheel's angle is cumulative: each spin adds five full turns plus
        // whatever brings the winning slice under the top pointer from where
        // the wheel currently rests, so it never rewinds between rounds.
        const sliceCenter = winIndex * sliceAngle + sliceAngle / 2;
        const restingAngle = ((angleRef.current % 360) + 360) % 360;
        const delta = ((360 - sliceCenter - restingAngle) % 360 + 360) % 360;
        const targetAngle = angleRef.current + 360 * 5 + delta;
        angleRef.current = targetAngle;

        setSpinAngle(targetAngle);

        setTimeout(() => {
            setResult(winningNumber);
            setPhase('result');
        }, 4000);
    }, [phase, bets]);

    const calculateWinnings = useCallback(() => {
        if (result === null) return 0;
        let winnings = 0;
        const color = getNumberColor(result);

        Object.entries(bets).forEach(([betType, amount]) => {
            // Standard Number Bet
            if (betType === `number-${result}`) {
                winnings += amount * 36;
            }
            // Outside Bets (1:1)
            else if (betType === 'red' && color === 'red') {
                winnings += amount * 2;
            } else if (betType === 'black' && color === 'black') {
                winnings += amount * 2;
            } else if (betType === 'odd' && result !== 0 && result % 2 === 1) {
                winnings += amount * 2;
            } else if (betType === 'even' && result !== 0 && result % 2 === 0) {
                winnings += amount * 2;
            } else if (betType === 'low' && result >= 1 && result <= 18) {
                winnings += amount * 2;
            } else if (betType === 'high' && result >= 19 && result <= 36) {
                winnings += amount * 2;
            }
            // Dozens (2:1)
            else if (betType === '1st12' && result >= 1 && result <= 12) {
                winnings += amount * 3;
            } else if (betType === '2nd12' && result >= 13 && result <= 24) {
                winnings += amount * 3;
            } else if (betType === '3rd12' && result >= 25 && result <= 36) {
                winnings += amount * 3;
            }
            // Column Bets (2:1)
            else if (betType === 'col-1' && result !== 0 && result % 3 === 0) {
                winnings += amount * 3;
            } else if (betType === 'col-2' && result !== 0 && result % 3 === 2) {
                winnings += amount * 3;
            } else if (betType === 'col-3' && result !== 0 && result % 3 === 1) {
                winnings += amount * 3;
            }
            // Street Bet (11:1) - format: street-1 (for 1,2,3)
            else if (betType.startsWith('street-')) {
                const start = parseInt(betType.split('-')[1]);
                if (result >= start && result <= start + 2) winnings += amount * 12;
            }
            // Corner Bet (8:1) - format: corner-1-2-4-5
            else if (betType.startsWith('corner-')) {
                const nums = betType.split('-').slice(1).map(Number);
                if (nums.includes(result)) winnings += amount * 9;
            }
            // Split Bet (17:1) - format: split-1-2
            else if (betType.startsWith('split-')) {
                const nums = betType.split('-').slice(1).map(Number);
                if (nums.includes(result)) winnings += amount * 18;
            }
        });

        return winnings;
    }, [result, bets]);

    const resetGame = useCallback(() => {
        setResult(null);
        setBets({});
        setPhase('betting');
    }, []);

    return {
        phase,
        result,
        spinAngle,
        bets,
        placeBet,
        removeBet,
        clearBets,
        getTotalBet,
        spin,
        calculateWinnings,
        resetGame,
    };
};
