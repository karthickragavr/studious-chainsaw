import { useState, useCallback } from 'react';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DEADWOOD_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10 };
const VALUE_INDEX = { 'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12 };

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value, id: `${suit}-${value}-${Math.random()}` });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const findMelds = (hand) => {
    const melds = [];

    // Find sets (3+ cards same value)
    const byValue = {};
    hand.forEach(c => {
        if (!byValue[c.value]) byValue[c.value] = [];
        byValue[c.value].push(c);
    });
    Object.values(byValue).forEach(group => {
        if (group.length >= 3) melds.push(group.slice(0, Math.min(group.length, 4)));
    });

    // Find runs (3+ consecutive same suit)
    const bySuit = {};
    hand.forEach(c => {
        if (!bySuit[c.suit]) bySuit[c.suit] = [];
        bySuit[c.suit].push(c);
    });
    Object.values(bySuit).forEach(suitCards => {
        const sorted = suitCards.sort((a, b) => VALUE_INDEX[a.value] - VALUE_INDEX[b.value]);
        let run = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            if (VALUE_INDEX[sorted[i].value] === VALUE_INDEX[sorted[i - 1].value] + 1) {
                run.push(sorted[i]);
            } else {
                if (run.length >= 3) melds.push([...run]);
                run = [sorted[i]];
            }
        }
        if (run.length >= 3) melds.push([...run]);
    });

    return melds;
};

const calculateDeadwood = (hand) => {
    const melds = findMelds(hand);
    const meldIds = new Set();
    melds.forEach(meld => meld.forEach(c => meldIds.add(c.id)));
    return hand.filter(c => !meldIds.has(c.id)).reduce((sum, c) => sum + DEADWOOD_VALUES[c.value], 0);
};

export const useRummy = () => {
    const [deck, setDeck] = useState([]);
    const [playerHand, setPlayerHand] = useState([]);
    const [aiHand, setAiHand] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [phase, setPhase] = useState('betting'); // betting, draw, discard, aiTurn, result
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');

    const dealGame = useCallback(() => {
        const newDeck = createDeck();
        const pHand = [];
        const aHand = [];
        for (let i = 0; i < 10; i++) {
            pHand.push(newDeck.pop());
            aHand.push(newDeck.pop());
        }
        const firstDiscard = newDeck.pop();

        setDeck(newDeck);
        setPlayerHand(sortHand(pHand));
        setAiHand(aHand);
        setDiscardPile([firstDiscard]);
        setResult(null);
        setMessage('Draw a card from the deck or discard pile.');
        setPhase('draw');
    }, []);

    const sortHand = (hand) => {
        return [...hand].sort((a, b) => {
            if (a.suit === b.suit) return VALUE_INDEX[a.value] - VALUE_INDEX[b.value];
            return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
        });
    };

    const drawFromDeck = useCallback(() => {
        if (phase !== 'draw') return;
        const newDeck = [...deck];
        if (newDeck.length === 0) {
            setResult('draw');
            setPhase('result');
            return;
        }
        const card = newDeck.pop();
        setDeck(newDeck);
        setPlayerHand(sortHand([...playerHand, card]));
        setMessage('Select a card to discard.');
        setPhase('discard');
    }, [phase, deck, playerHand]);

    const drawFromDiscard = useCallback(() => {
        if (phase !== 'draw' || discardPile.length === 0) return;
        const newDiscard = [...discardPile];
        const card = newDiscard.pop();
        setDiscardPile(newDiscard);
        setPlayerHand(sortHand([...playerHand, card]));
        setMessage('Select a card to discard.');
        setPhase('discard');
    }, [phase, discardPile, playerHand]);

    const discardCard = useCallback((cardId) => {
        if (phase !== 'discard') return;
        const card = playerHand.find(c => c.id === cardId);
        if (!card) return;
        const newHand = playerHand.filter(c => c.id !== cardId);
        setPlayerHand(sortHand(newHand));
        setDiscardPile(prev => [...prev, card]);
        setMessage('AI is thinking...');
        setPhase('aiTurn');

        // AI turn
        setTimeout(() => playAiTurn(newHand, [...discardPile, card], [...deck]), 1000);
    }, [phase, playerHand, discardPile, deck]);

    const playAiTurn = (currentPlayerHand, currentDiscard, currentDeck) => {
        let newAiHand = [...aiHand];
        let newDiscard = [...currentDiscard];
        let newDeck = [...currentDeck];

        // AI decides: draw from discard if it helps form a meld
        const topDiscard = newDiscard[newDiscard.length - 1];
        let drawnFromDiscard = false;

        if (topDiscard) {
            const testHand = [...newAiHand, topDiscard];
            const currentMelds = findMelds(newAiHand).length;
            const newMelds = findMelds(testHand).length;
            if (newMelds > currentMelds) {
                newAiHand.push(newDiscard.pop());
                drawnFromDiscard = true;
            }
        }

        if (!drawnFromDiscard) {
            if (newDeck.length === 0) {
                setResult('draw');
                setPhase('result');
                return;
            }
            newAiHand.push(newDeck.pop());
        }

        // AI discards highest deadwood card not in a meld
        const melds = findMelds(newAiHand);
        const meldIds = new Set();
        melds.forEach(m => m.forEach(c => meldIds.add(c.id)));
        const deadwoodCards = newAiHand.filter(c => !meldIds.has(c.id));

        let discardCard;
        if (deadwoodCards.length > 0) {
            discardCard = deadwoodCards.sort((a, b) => DEADWOOD_VALUES[b.value] - DEADWOOD_VALUES[a.value])[0];
        } else {
            discardCard = newAiHand[newAiHand.length - 1];
        }

        newAiHand = newAiHand.filter(c => c.id !== discardCard.id);
        newDiscard.push(discardCard);

        setAiHand(newAiHand);
        setDiscardPile(newDiscard);
        setDeck(newDeck);

        // Check if AI can knock
        const aiDeadwood = calculateDeadwood(newAiHand);
        if (aiDeadwood <= 10) {
            // A knock is a showdown: the player undercuts if their deadwood is lower
            const playerDeadwood = calculateDeadwood(currentPlayerHand);
            if (playerDeadwood < aiDeadwood) {
                setResult('player');
                setMessage(`AI knocks with ${aiDeadwood}, but you undercut with ${playerDeadwood}!`);
            } else {
                setResult('ai');
                setMessage(`AI knocks with ${aiDeadwood} deadwood!`);
            }
            setPhase('result');
            return;
        }

        setMessage('Your turn — draw a card.');
        setPhase('draw');
    };

    const knock = useCallback(() => {
        if (phase !== 'draw' && phase !== 'discard') return;
        const deadwood = calculateDeadwood(playerHand.length > 10 ? playerHand : playerHand);
        if (playerHand.length > 10 || deadwood > 10) return; // Can only knock with 10 cards and ≤10 deadwood

        const aiDeadwood = calculateDeadwood(aiHand);
        if (deadwood === 0) {
            setResult('gin');
            setMessage('GIN! You win big!');
        } else if (deadwood < aiDeadwood) {
            setResult('player');
            setMessage(`You knock with ${deadwood} vs AI's ${aiDeadwood}!`);
        } else {
            setResult('undercut');
            setMessage(`AI undercuts! AI: ${aiDeadwood} vs Your: ${deadwood}`);
        }
        setPhase('result');
    }, [phase, playerHand, aiHand]);

    const resetGame = useCallback(() => {
        setPlayerHand([]);
        setAiHand([]);
        setDiscardPile([]);
        setResult(null);
        setMessage('');
        setPhase('betting');
    }, []);

    return {
        playerHand,
        aiHand,
        discardPile,
        deck,
        phase,
        result,
        message,
        playerDeadwood: calculateDeadwood(playerHand),
        aiDeadwood: calculateDeadwood(aiHand),
        dealGame,
        drawFromDeck,
        drawFromDiscard,
        discardCard,
        knock,
        resetGame,
    };
};
