/**
 * Teen Patti Hand Evaluation & Bot Logic
 *
 * Hand Rankings (Highest to Lowest):
 * 1. Trail / Trio (Three of a Kind)
 * 2. Pure Sequence (Straight Flush)
 * 3. Sequence (Straight)
 * 4. Color (Flush)
 * 5. Pair (Two of a Kind)
 * 6. High Card
 */

// Card utilities
const getValue = (card) => {
    // A=14, K=13, Q=12, J=11, 10=10...
    const val = card.value;
    if (val === 'A') return 14;
    if (val === 'K') return 13;
    if (val === 'Q') return 12;
    if (val === 'J') return 11;
    return parseInt(val, 10);
};

const getSuit = (card) => card.suit;

/**
 * Evaluate a 3-card hand and return an object with its rank and score for comparison.
 * Returns: { rankString: string, score: number }
 * Score is constructed such that a higher number always beats a lower number.
 * Note: A-2-3 is a valid sequence, and A is considered high for the sequence (14-3-2), but mathematically A-K-Q is higher.
 */
export const evaluateHand = (hand) => {
    if (!hand || hand.length !== 3) return { rankString: 'High Card', score: 0 };

    // Sort cards descending by value
    const sorted = [...hand].sort((a, b) => getValue(b) - getValue(a));
    const v1 = getValue(sorted[0]);
    const v2 = getValue(sorted[1]);
    const v3 = getValue(sorted[2]);

    const s1 = getSuit(sorted[0]);
    const s2 = getSuit(sorted[1]);
    const s3 = getSuit(sorted[2]);

    const isFlush = s1 === s2 && s2 === s3;

    // Check for sequence
    let isSequence = (v1 - 1 === v2 && v2 - 1 === v3);
    // Special case for A-2-3 sequence (14, 3, 2 in sorted order)
    if (v1 === 14 && v2 === 3 && v3 === 2) {
        isSequence = true;
    }

    const isTrio = v1 === v2 && v2 === v3;
    const isPair = v1 === v2 || v2 === v3 || v1 === v3;

    // Helper to build a unique score. We use base-15 math to ensure uniqueness.
    // Base rank * 15^3 + high card * 15^2 + middle card * 15 + low card.
    // Exception for A-2-3 sequence: it's lower than A-K-Q but higher than 4-3-2. Wait, in Teen Patti, A-2-3 is the *highest* sequence, A-K-Q is the second highest.
    // Let's implement standard Teen Patti rules: A-2-3 > A-K-Q > K-Q-J > ... > 4-3-2.
    const computeScore = (baseRank, val1, val2, val3) => {
        return baseRank * 1000000 + val1 * 10000 + val2 * 100 + val3;
    };

    if (isTrio) {
        // Trail / Trio
        return { rankString: 'Trail', score: computeScore(6, v1, v2, v3) };
    }

    if (isSequence && isFlush) {
        // Pure Sequence
        if (v1 === 14 && v2 === 3 && v3 === 2) {
            // A-2-3 is the highest
            return { rankString: 'Pure Sequence', score: computeScore(5, 15, 3, 2) };
        }
        return { rankString: 'Pure Sequence', score: computeScore(5, v1, v2, v3) };
    }

    if (isSequence) {
        // Sequence
        if (v1 === 14 && v2 === 3 && v3 === 2) {
            return { rankString: 'Sequence', score: computeScore(4, 15, 3, 2) };
        }
        return { rankString: 'Sequence', score: computeScore(4, v1, v2, v3) };
    }

    if (isFlush) {
        // Color
        return { rankString: 'Color', score: computeScore(3, v1, v2, v3) };
    }

    if (isPair) {
        // Pair
        // The paired value should be the most significant for tie-breaking.
        let pairVal, kicker;
        if (v1 === v2) {
            pairVal = v1; kicker = v3;
        } else if (v2 === v3) {
            pairVal = v2; kicker = v1;
        } else {
            pairVal = v1; kicker = v2; // shouldn't happen in sorted 3 cards
        }
        return { rankString: 'Pair', score: computeScore(2, pairVal, pairVal, kicker) };
    }

    // High Card
    return { rankString: 'High Card', score: computeScore(1, v1, v2, v3) };
};

/**
 * Basic AI for a bot taking a turn.
 * @param {object} botState - { hand, isBlind, status... }
 * @param {number} currentBet - The current bet amount needed to call (for seen players).
 * @param {number} pot - Current pot size.
 * @returns {object} { action: 'fold' | 'call' | 'raise', amount?: number, isBlind?: boolean }
 */
export const getBotAction = (botState, currentBet, pot) => {
    // If bot is playing blind, it occasionally checks its cards (becomes seen)
    let isBlind = botState.isBlind;
    if (isBlind && Math.random() < 0.3) {
        isBlind = false; // Bot "sees" its cards
    }

    // Determine hand strength (1 to 6)
    const evalResult = evaluateHand(botState.hand);
    const rankValue = Math.floor(evalResult.score / 1000000); // 1 to 6

    // If blind, play loose but fold occasionally if current bet gets high vs pot
    if (isBlind) {
        if (Math.random() < 0.1) return { action: 'fold', isBlind: true };
        if (Math.random() < 0.2) return { action: 'raise', amount: currentBet * 2, isBlind: true };
        return { action: 'call', isBlind: true };
    }

    // Seen strategy
    switch (rankValue) {
        case 1: // High Card
            // High card is very weak in Teen Patti. Fold 80% of the time.
            if (Math.random() < 0.8) return { action: 'fold', isBlind: false };
            return { action: 'call', isBlind: false }; // Bluff call

        case 2: // Pair
            // Medium strength. Fold 30%, Call 60%, Raise 10%
            if (Math.random() < 0.3) return { action: 'fold', isBlind: false };
            if (Math.random() < 0.9) return { action: 'call', isBlind: false };
            return { action: 'raise', amount: currentBet * 2, isBlind: false };

        case 3: // Color
        case 4: // Sequence
            // Strong. Never fold. Call 50%, Raise 50%
            if (Math.random() < 0.5) return { action: 'call', isBlind: false };
            return { action: 'raise', amount: currentBet * 2, isBlind: false };

        case 5: // Pure Sequence
        case 6: // Trail
            // Monster. Never fold. Call 20% (slow play), Raise 80%
            if (Math.random() < 0.2) return { action: 'call', isBlind: false };
            return { action: 'raise', amount: currentBet * 2, isBlind: false };

        default:
            return { action: 'fold', isBlind: false };
    }
};
