import { useState, useCallback, useEffect } from 'react';
import { playCardSnap, playShuffle } from '../utils/sounds';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardValue = (value) => {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
};

const calculateHand = (cards) => {
    if (!cards || cards.length === 0) return 0;
    let total = cards.reduce((sum, card) => sum + getCardValue(card.value), 0);
    let aces = cards.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
};

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value, id: `${suit}-${value}-${Math.random()}` });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
    // return deck; // No shuffle for debugging? No, keep shuffle.
};

export const useBlackjack = () => {
    const [deck, setDeck] = useState([]);
    // hands: Array of { cards: [], betMultiplier: 1, status: 'playing'|'stood'|'busted'|'doubled'|'blackjack', result: null|'win'|'lose'|'push'|'blackjack' }
    const [hands, setHands] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [phase, setPhase] = useState('betting'); // betting, playing, dealer, result, insurance
    const [currentHandIndex, setCurrentHandIndex] = useState(0);
    const [dealerRevealed, setDealerRevealed] = useState(false);

    // Insurance state
    const [insuranceAvailable, setInsuranceAvailable] = useState(false);
    const [insuranceTaken, setInsuranceTaken] = useState(false);
    const [insuranceWin, setInsuranceWin] = useState(false);

    // Initial Deal
    const deal = useCallback(() => {
        playShuffle();
        const newDeck = createDeck();
        const pCard1 = newDeck.pop();
        const dCard1 = newDeck.pop(); // Dealer Up Card
        const pCard2 = newDeck.pop();
        const dCard2 = newDeck.pop(); // Dealer Hole Card

        setDeck(newDeck);
        const initialHand = {
            cards: [pCard1, pCard2],
            betMultiplier: 1,
            status: 'playing',
            result: null
        };
        const newHands = [initialHand];
        setHands(newHands);
        setDealerHand([dCard1, dCard2]);
        setDealerRevealed(false);
        setInsuranceAvailable(false);
        setInsuranceTaken(false);
        setInsuranceWin(false);
        setCurrentHandIndex(0);

        playCardSnap();

        const playerTotal = calculateHand([pCard1, pCard2]);

        // Check for Dealer Ace (Insurance Opportunity)
        if (dCard1.value === 'A') {
            setInsuranceAvailable(true);
            setPhase('insurance');
            return;
        }

        // Check for Immediate Blackjack
        if (playerTotal === 21) {
            const dTotal = calculateHand([dCard1, dCard2]);
            setDealerRevealed(true);
            setPhase('result');

            if (dTotal === 21) {
                // Dealer also has BJ -> Push
                setHands([{ ...initialHand, status: 'blackjack', result: 'push' }]);
            } else {
                // Player Natural BJ -> Win 3:2 (handled in UI via status)
                setHands([{ ...initialHand, status: 'blackjack', result: 'blackjack' }]);
            }
            return;
        }

        // Dealer Immediate BJ check (if face card showing)
        // Standard rules: Dealer peeks on 10 or Ace. We handled Ace (insurance).
        // If 10/Face showing, peek now?
        if (getCardValue(dCard1.value) === 10) {
            const dTotal = calculateHand([dCard1, dCard2]);
            if (dTotal === 21) {
                setDealerRevealed(true);
                setPhase('result');
                setHands([{ ...initialHand, status: 'playing', result: 'lose' }]);
                return;
            }
        }

        setPhase('playing');
    }, []);

    const hit = useCallback(() => {
        if (phase !== 'playing') return;

        let shouldAdvance = false;

        setHands(prevHands => {
            const newHands = [...prevHands];
            const currentHand = { ...newHands[currentHandIndex] };

            const newDeck = [...deck];
            const card = newDeck.pop();
            setDeck(newDeck);

            currentHand.cards = [...currentHand.cards, card];
            playCardSnap();

            const total = calculateHand(currentHand.cards);
            if (total > 21) {
                currentHand.status = 'busted';
                currentHand.result = 'lose';
                shouldAdvance = true;
            } else if (total === 21) {
                currentHand.status = 'stood';
                shouldAdvance = true;
            }

            newHands[currentHandIndex] = currentHand;
            return newHands;
        });

        if (shouldAdvance) {
            // No direct advancement here, handled by effect
        }

    }, [phase, deck, currentHandIndex]);

    const stand = useCallback(() => {
        if (phase !== 'playing') return;

        setHands(prev => {
            const newHands = [...prev];
            newHands[currentHandIndex] = { ...newHands[currentHandIndex], status: 'stood' };
            return newHands;
        });
    }, [phase, currentHandIndex]);

    const doubleDown = useCallback(() => {
        if (phase !== 'playing') return false;
        const currentHand = hands[currentHandIndex];
        if (currentHand.cards.length !== 2) return false;

        setHands(prev => {
            const newHands = [...prev];
            const hand = { ...newHands[currentHandIndex] };

            const newDeck = [...deck];
            const card = newDeck.pop();
            setDeck(newDeck);

            hand.cards = [...hand.cards, card];
            hand.betMultiplier = 2;
            playCardSnap();

            const total = calculateHand(hand.cards);
            if (total > 21) {
                hand.status = 'busted';
                hand.result = 'lose';
            } else {
                hand.status = 'doubled'; // effectively stood
            }

            newHands[currentHandIndex] = hand;
            return newHands;
        });
        return true;
    }, [phase, deck, hands, currentHandIndex]);

    const split = useCallback(() => {
        if (phase !== 'playing') return false;
        const currentHand = hands[currentHandIndex];
        if (currentHand.cards.length !== 2) return false;

        // Check Values (Point Value Equality)
        if (getCardValue(currentHand.cards[0].value) !== getCardValue(currentHand.cards[1].value)) return false;

        setHands(prev => {
            const newHands = [...prev];
            const c1 = currentHand.cards[0];
            const c2 = currentHand.cards[1];

            const newDeck = [...deck];
            const h1Card = newDeck.pop();
            const h2Card = newDeck.pop();
            setDeck(newDeck);

            // Hand 1 replaces current
            newHands[currentHandIndex] = {
                cards: [c1, h1Card],
                betMultiplier: 1,
                status: 'playing',
                result: null
            };

            // Hand 2 inserts after
            newHands.splice(currentHandIndex + 1, 0, {
                cards: [c2, h2Card],
                betMultiplier: 1,
                status: 'playing',
                result: null
            });

            playCardSnap();
            return newHands;
        });

        return true;
    }, [phase, hands, currentHandIndex, deck]);

    const resolveInsurance = useCallback((takeIt) => {
        if (takeIt) setInsuranceTaken(true);
        setInsuranceAvailable(false);

        const dTotal = calculateHand(dealerHand);
        // Dealer Hole Card Check
        // If dealer has BJ, round ends.
        if (dTotal === 21) {
            setDealerRevealed(true);
            setPhase('result');
            if (takeIt) setInsuranceWin(true);

            setHands(prev => prev.map(h => {
                const pTotal = calculateHand(h.cards);
                // BJ Push if player also has BJ
                return {
                    ...h,
                    status: 'stood',
                    result: pTotal === 21 ? 'push' : 'lose'
                };
            }));
        } else {
            // No Dealer BJ
            if (takeIt) setInsuranceWin(false);

            // Check Player BJ again (was paused)
            const pTotal = calculateHand(hands[0].cards);
            if (pTotal === 21) {
                setDealerRevealed(true);
                setPhase('result');
                setHands(prev => [{ ...prev[0], status: 'blackjack', result: 'blackjack' }]);
            } else {
                setPhase('playing');
            }
        }
    }, [dealerHand, hands]);


    // Turn Advancement Effect
    useEffect(() => {
        if (phase !== 'playing') return;

        const currentHand = hands[currentHandIndex];
        if (!currentHand) return; // safety

        const isDone = ['stood', 'busted', 'doubled', 'blackjack'].includes(currentHand.status);

        if (isDone) {
            const timer = setTimeout(() => {
                if (currentHandIndex < hands.length - 1) {
                    setCurrentHandIndex(i => i + 1);
                } else {
                    // All hands done
                    const hasLiveHand = hands.some(h => ['stood', 'doubled', 'playing'].includes(h.status));
                    // Actually, if we are 'stood' or 'doubled', we are 'live'. 'busted' is dead.

                    if (hasLiveHand) {
                        setPhase('dealer');
                    } else {
                        // All busted
                        setDealerRevealed(true);
                        setPhase('result');
                        setHands(prev => prev.map(h => ({ ...h, result: 'lose' })));
                    }
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [hands, currentHandIndex, phase]);


    // Dealer Play Effect
    useEffect(() => {
        if (phase === 'dealer') {
            setDealerRevealed(true);
            const dTotal = calculateHand(dealerHand);

            const timer = setTimeout(() => {
                if (dTotal < 17) {
                    // Hit
                    const newDeck = [...deck];
                    const card = newDeck.pop();
                    setDeck(newDeck);
                    setDealerHand([...dealerHand, card]);
                    playCardSnap();
                } else {
                    // Stand / Finish
                    setPhase('result');
                    setHands(prev => prev.map(h => {
                        if (h.status === 'busted') return { ...h, result: 'lose' };
                        if (h.status === 'blackjack') return { ...h, result: 'blackjack' };

                        const pTotal = calculateHand(h.cards);
                        if (dTotal > 21) return { ...h, result: 'win' };
                        if (pTotal > dTotal) return { ...h, result: 'win' };
                        if (pTotal < dTotal) return { ...h, result: 'lose' };
                        return { ...h, result: 'push' };
                    }));
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [phase, dealerHand, deck]); // Runs on every dealerHand update


    // Reset
    const resetGame = useCallback(() => {
        setHands([]);
        setDealerHand([]);
        setPhase('betting');
        setInsuranceAvailable(false);
        setInsuranceTaken(false);
        setInsuranceWin(false);
        setDealerRevealed(false);
        setCurrentHandIndex(0);
    }, []);

    // Helpers
    const activeHand = hands[currentHandIndex];
    const canSplit = activeHand?.cards?.length === 2 &&
        phase === 'playing' &&
        getCardValue(activeHand.cards[0].value) === getCardValue(activeHand.cards[1].value);

    return {
        hands,
        activeHand,
        currentHandIndex,
        dealerHand,
        phase,
        dealerRevealed,
        // Compat
        playerTotal: activeHand ? calculateHand(activeHand.cards) : 0,
        dealerTotal: dealerRevealed ? calculateHand(dealerHand) : (dealerHand.length > 0 ? getCardValue(dealerHand[0].value) : 0),
        result: hands.length > 0 ? hands[0].result : null, // Partial compat

        deal,
        hit,
        stand,
        doubleDown,
        split,
        resolveInsurance,
        resetGame,

        canSplit,
        insuranceAvailable,
        insuranceTaken,
        insuranceWin
    };
};
