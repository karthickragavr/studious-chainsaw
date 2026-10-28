import { useState, useCallback } from 'react';
import { playCardSnap, playShuffle } from '../utils/sounds';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUE_RANK = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value, id: `${suit}-${value}-${Math.random()}` });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

export const PAY_TABLE = [
    { name: 'Royal Flush', multiplier: 800 },
    { name: 'Straight Flush', multiplier: 50 },
    { name: 'Four of a Kind', multiplier: 25 },
    { name: 'Full House', multiplier: 9 },
    { name: 'Flush', multiplier: 6 },
    { name: 'Straight', multiplier: 4 },
    { name: 'Three of a Kind', multiplier: 3 },
    { name: 'Two Pair', multiplier: 2 },
    { name: 'Jacks or Better', multiplier: 1 },
];

const evaluateHand = (cards) => {
    const values = cards.map(c => VALUE_RANK[c.value]).sort((a, b) => a - b);
    const suits = cards.map(c => c.suit);
    const valueCounts = {};
    values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
    const counts = Object.values(valueCounts).sort((a, b) => b - a);

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = (values[4] - values[0] === 4 && new Set(values).size === 5) ||
        (values.join(',') === '2,3,4,5,14'); // Ace-low straight

    const isRoyal = isFlush && values.join(',') === '10,11,12,13,14';

    if (isRoyal) return { name: 'Royal Flush', multiplier: 800 };
    if (isFlush && isStraight) return { name: 'Straight Flush', multiplier: 50 };
    if (counts[0] === 4) return { name: 'Four of a Kind', multiplier: 25 };
    if (counts[0] === 3 && counts[1] === 2) return { name: 'Full House', multiplier: 9 };
    if (isFlush) return { name: 'Flush', multiplier: 6 };
    if (isStraight) return { name: 'Straight', multiplier: 4 };
    if (counts[0] === 3) return { name: 'Three of a Kind', multiplier: 3 };
    if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pair', multiplier: 2 };
    if (counts[0] === 2) {
        // Check for Jacks or Better
        const pairValue = parseInt(Object.keys(valueCounts).find(k => valueCounts[k] === 2));
        if (pairValue >= 11) return { name: 'Jacks or Better', multiplier: 1 };
    }

    return { name: 'No Win', multiplier: 0 };
};

export const usePoker = () => {
    const [deck, setDeck] = useState([]);
    const [hand, setHand] = useState([]);
    const [held, setHeld] = useState([false, false, false, false, false]);
    const [phase, setPhase] = useState('betting'); // betting, deal, draw, result
    const [result, setResult] = useState(null);

    const dealHand = useCallback(() => {
        playShuffle();
        const newDeck = createDeck();
        const newHand = [];
        for (let i = 0; i < 5; i++) {
            newHand.push(newDeck.pop());
        }
        setDeck(newDeck);
        setHand(newHand);
        setHeld([false, false, false, false, false]);
        setResult(null);
        setPhase('deal');
    }, []);

    const toggleHold = useCallback((index) => {
        if (phase !== 'deal') return;
        setHeld(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    }, [phase]);

    const drawCards = useCallback(() => {
        if (phase !== 'deal') return;
        const newDeck = [...deck];
        const newHand = hand.map((card, i) => {
            if (held[i]) return card;
            return newDeck.pop();
        });
        setDeck(newDeck);
        setHand(newHand);

        const handResult = evaluateHand(newHand);
        setResult(handResult);
        setPhase('result');
    }, [phase, deck, hand, held]);

    const resetGame = useCallback(() => {
        setHand([]);
        setHeld([false, false, false, false, false]);
        setResult(null);
        setPhase('betting');
    }, []);

    return {
        hand,
        held,
        phase,
        result,
        dealHand,
        toggleHold,
        drawCards,
        resetGame,
    };
};
