import { useState, useCallback } from 'react';
import { playCardSnap, playShuffle } from '../utils/sounds';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const cardValue = (value) => {
    if (value === 'A') return 1;
    if (['10', 'J', 'Q', 'K'].includes(value)) return 0;
    return parseInt(value);
};

const handTotal = (cards) => {
    return cards.reduce((sum, c) => sum + cardValue(c.value), 0) % 10;
};

const createDeck = () => {
    const deck = [];
    // 8-deck shoe
    for (let d = 0; d < 8; d++) {
        for (const suit of SUITS) {
            for (const value of VALUES) {
                deck.push({ suit, value, id: `${suit}-${value}-${Math.random()}` });
            }
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

export const useBaccarat = () => {
    const [playerHand, setPlayerHand] = useState([]);
    const [bankerHand, setBankerHand] = useState([]);
    const [phase, setPhase] = useState('betting'); // betting, dealing, result
    const [result, setResult] = useState(null); // player, banker, tie

    const deal = useCallback(() => {
        playShuffle();
        const deck = createDeck();
        const pHand = [deck.pop(), deck.pop()];
        const bHand = [deck.pop(), deck.pop()];

        let pTotal = handTotal(pHand);
        let bTotal = handTotal(bHand);

        // Natural — 8 or 9
        if (pTotal >= 8 || bTotal >= 8) {
            setPlayerHand(pHand);
            setBankerHand(bHand);
            setPhase('dealing');
            playCardSnap();

            setTimeout(() => {
                determineWinner(pHand, bHand);
            }, 1500);
            return;
        }

        // Player third card rule
        let playerThird = null;
        if (pTotal <= 5) {
            playerThird = deck.pop();
            pHand.push(playerThird);
        }

        // Banker third card rule (tableau)
        const pThirdVal = playerThird ? cardValue(playerThird.value) : -1;

        let bankerDraws = false;
        if (playerThird === null) {
            // Player stood
            bankerDraws = bTotal <= 5;
        } else {
            // Player drew
            if (bTotal <= 2) bankerDraws = true;
            else if (bTotal === 3 && pThirdVal !== 8) bankerDraws = true;
            else if (bTotal === 4 && [2, 3, 4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
            else if (bTotal === 5 && [4, 5, 6, 7].includes(pThirdVal)) bankerDraws = true;
            else if (bTotal === 6 && [6, 7].includes(pThirdVal)) bankerDraws = true;
        }

        if (bankerDraws) {
            bHand.push(deck.pop());
        }

        setPlayerHand(pHand);
        setBankerHand(bHand);
        setPhase('dealing');
        playCardSnap();

        setTimeout(() => {
            determineWinner(pHand, bHand);
        }, 2000);
    }, []);

    const determineWinner = (pHand, bHand) => {
        const pTotal = handTotal(pHand);
        const bTotal = handTotal(bHand);

        if (pTotal > bTotal) setResult('player');
        else if (bTotal > pTotal) setResult('banker');
        else setResult('tie');

        setPhase('result');
    };

    const resetGame = useCallback(() => {
        setPlayerHand([]);
        setBankerHand([]);
        setResult(null);
        setPhase('betting');
    }, []);

    return {
        playerHand,
        bankerHand,
        playerTotal: handTotal(playerHand),
        bankerTotal: handTotal(bankerHand),
        phase,
        result,
        deal,
        resetGame,
    };
};
