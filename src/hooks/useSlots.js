import { useState, useCallback } from 'react';
import { playSlotSpin, playChipClick } from '../utils/sounds';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣'];

const PAYOUTS = {
    '7️⃣': { three: 50, label: 'Jackpot 7s' },
    '💎': { three: 25, label: 'Triple Diamonds' },
    '🔔': { three: 10, label: 'Triple Bells' },
    '🍋': { three: 5, label: 'Triple Lemons' },
    '🍒': { three: 3, two: 2, label: 'Cherries' },
};

const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

export const SLOT_SYMBOLS = SYMBOLS;
export const SLOT_PAYOUTS = PAYOUTS;

export const useSlots = () => {
    const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
    const [phase, setPhase] = useState('idle'); // idle, spinning, result
    const [spinning, setSpinning] = useState([false, false, false]);
    const [result, setResult] = useState(null);

    const spin = useCallback(() => {
        if (phase === 'spinning') return;
        setPhase('spinning');
        setResult(null);

        // Determine the final result
        const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

        setSpinning([true, true, true]);
        playSlotSpin();

        // Stop reels one by one
        const stopReel = (index) => {
            setTimeout(() => {
                setReels(prev => {
                    const updated = [...prev];
                    updated[index] = finalReels[index];
                    return updated;
                });
                setSpinning(prev => {
                    const updated = [...prev];
                    updated[index] = false;
                    return updated;
                });
                playChipClick();

                if (index === 2) {
                    // All reels stopped
                    setTimeout(() => {
                        const payout = calculatePayout(finalReels);
                        setResult(payout);
                        setPhase('result');
                    }, 300);
                }
            }, 800 + index * 600);
        };

        stopReel(0);
        stopReel(1);
        stopReel(2);
    }, [phase]);

    const calculatePayout = (finalReels) => {
        const [a, b, c] = finalReels;

        // Three of a kind
        if (a === b && b === c) {
            return { multiplier: PAYOUTS[a].three, match: 'three', symbol: a };
        }

        // Two cherries
        const cherryCount = finalReels.filter(s => s === '🍒').length;
        if (cherryCount === 2) {
            return { multiplier: 2, match: 'two-cherry', symbol: '🍒' };
        }

        return { multiplier: 0, match: 'none', symbol: null };
    };

    const resetGame = useCallback(() => {
        setResult(null);
        setPhase('idle');
    }, []);

    return {
        reels,
        phase,
        spinning,
        result,
        spin,
        resetGame,
    };
};
