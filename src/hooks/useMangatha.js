import { useState, useCallback } from 'react';
import { playCardSnap, playShuffle } from '../utils/sounds';

const SUITS = ['♠', '♥', '♣', '♦'];

const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const useMangatha = () => {
    const [deck, setDeck] = useState([]);
    const [joker, setJoker] = useState(null);
    const [andarCards, setAndarCards] = useState([]);
    const [baharCards, setBaharCards] = useState([]);
    const [winner, setWinner] = useState(null);
    const [phase, setPhase] = useState('betting'); // betting, joker, dealing, result
    const [isDealing, setIsDealing] = useState(false);


    const createDeck = useCallback(() => {
        const newDeck = [];
        for (const suit of SUITS) {
            for (const value of VALUES) {
                newDeck.push({ suit, value, id: `${suit}-${value}-${Math.random()}` });
            }
        }
        return newDeck.sort(() => Math.random() - 0.5);
    }, []);

    const pickJoker = useCallback(() => {
        const newDeck = createDeck();
        const jokerCard = newDeck.pop();
        setJoker(jokerCard);
        setDeck(newDeck);
        playShuffle();

        setAndarCards([]);
        setBaharCards([]);
        setWinner(null);
        setPhase('joker');
        return jokerCard;
    }, [createDeck]);

    const startDealing = useCallback(() => {
        if (!joker || phase !== 'joker') return;

        setIsDealing(true);
        setPhase('dealing');

        let currentAndar = [];
        let currentBahar = [];
        let foundWinner = null;
        let turn = 'andar';
        const activeDeck = [...deck];

        const dealNext = () => {
            if (activeDeck.length === 0 || foundWinner) {
                setIsDealing(false);
                setWinner(foundWinner);
                setPhase('result');
                return;
            }

            const card = activeDeck.pop();
            playCardSnap();
            if (turn === 'andar') {
                currentAndar = [...currentAndar, card];
                setAndarCards([...currentAndar]);
                if (card.value === joker.value) {
                    foundWinner = 'andar';
                }
                turn = 'bahar';
            } else {
                currentBahar = [...currentBahar, card];
                setBaharCards([...currentBahar]);
                if (card.value === joker.value) {
                    foundWinner = 'bahar';
                }
                turn = 'andar';
            }

            setTimeout(dealNext, 600);
        };

        dealNext();
    }, [deck, joker, phase]);

    const resetGame = useCallback(() => {
        setJoker(null);
        setAndarCards([]);
        setBaharCards([]);
        setWinner(null);
        setPhase('betting');
    }, []);

    return {
        joker,
        andarCards,
        baharCards,
        winner,
        phase,
        isDealing,
        pickJoker,
        startDealing,
        resetGame
    };
};
