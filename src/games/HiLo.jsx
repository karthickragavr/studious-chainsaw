import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Equal, TrendingUp, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import Table from '../components/Table';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import ResultModal from '../components/ResultModal';
import HowToPlay from '../components/HowToPlay';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import { playWinJingle, playLossStinger } from '../utils/sounds';

// ─────────────────────────────────────────────
// Deck helpers
// ─────────────────────────────────────────────
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

function buildDeck() {
    return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function shuffle(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

// ─────────────────────────────────────────────
// Streak multiplier table
// ─────────────────────────────────────────────
const MULTIPLIER = [1, 2, 3, 5, 8]; // index = wins in current streak
const getMultiplier = (streak) => MULTIPLIER[Math.min(streak, MULTIPLIER.length - 1)];

// ─────────────────────────────────────────────
// HowToPlay content
// ─────────────────────────────────────────────
const HILO_RULES = [
    'A card is shown face-up.',
    'Predict if the next card will be Higher, Lower, or Equal.',
    'Correct prediction = win your bet × the current multiplier.',
    'Chain correct guesses to grow the multiplier (up to 8×).',
    '"Equal" pays 8:1 but only wins when values match exactly.',
    'Wrong guess = lose your bet. Collect any time to bank winnings.',
];
const HILO_STEPS = [
    'Select a chip amount at the bottom.',
    'Click Higher, Lower, or Equal to make your prediction.',
    'A new card is revealed — correct means you win!',
    'After a win, choose to Collect your winnings or Risk Again.',
    'Streak up to 4+ wins → 8× multiplier!',
];
const HILO_TIPS = [
    'Aces are low (rank 1). Kings are the highest (rank 13).',
    'Higher and Lower each cover ~46% of outcomes — Equal is rare (~8%).',
    'Collect after 2–3 wins to avoid losing your streak profits.',
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
function HiLo() {
    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [deck, setDeck] = useState(() => shuffle(buildDeck()));
    const [deckIdx, setDeckIdx] = useState(0);

    // Current face-up card
    const [currentCard, setCurrentCard] = useState(null);
    // Next card revealed after guess
    const [nextCard, setNextCard] = useState(null);

    const [phase, setPhase] = useState('start'); // start | betting | reveal | reveal-win | collect | result
    const [bet, setBet] = useState(100);
    const [streak, setStreak] = useState(0);
    const [pending, setPending] = useState(0); // accumulated winnings this streak
    const [lastResult, setLastResult] = useState(null); // win | loss | equal-win | equal-loss
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);

    // ── Deal the first card ──────────────────
    const startRound = useCallback(() => {
        let d = deck;
        let idx = deckIdx;
        if (idx + 2 >= d.length) {
            d = shuffle(buildDeck());
            idx = 0;
            setDeck(d);
        }
        const card = d[idx];
        setCurrentCard(card);
        setNextCard(null);
        setDeckIdx(idx + 1);
        setStreak(0);
        setPending(0);
        setLastResult(null);
        setPhase('betting');
    }, [deck, deckIdx]);

    // ── Make a guess ─────────────────────────
    const guess = useCallback((prediction) => {
        if (phase !== 'betting') return;
        if (bet > balance && streak === 0) return;

        // Deduct bet on first guess of a round
        if (streak === 0) updateBalance(-bet);

        let d = deck;
        let idx = deckIdx;
        if (idx >= d.length) {
            d = shuffle(buildDeck());
            idx = 0;
            setDeck(d);
        }

        const next = d[idx];
        setDeckIdx(idx + 1);
        setNextCard(next);
        setPhase('reveal');

        const curRank = RANK[currentCard.value];
        const nxtRank = RANK[next.value];
        const mult = getMultiplier(streak);

        const isEqual = curRank === nxtRank;
        const isHigher = nxtRank > curRank;
        const isLower = nxtRank < curRank;

        let won = false;
        if (prediction === 'higher' && isHigher) won = true;
        if (prediction === 'lower' && isLower) won = true;
        if (prediction === 'equal' && isEqual) won = true;

        // Equal pays 8:1
        const equalMult = 8;
        const payout = prediction === 'equal'
            ? (won ? bet * equalMult : 0)
            : (won ? bet * mult : 0);

        setTimeout(() => {
            if (won) {
                const newStreak = streak + 1;
                const newPending = (prediction === 'equal') ? pending + payout : pending + bet * getMultiplier(newStreak - 1);
                setStreak(newStreak);
                setPending(newPending);
                setLastResult(prediction === 'equal' ? 'equal-win' : 'win');
                playWinJingle();
                if (newStreak >= 3) confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 } });

                // ── Stay in reveal-win so player sees the card for 1.5s ──
                setPhase('reveal-win');
                setTimeout(() => {
                    setCurrentCard(next);
                    setNextCard(null);
                    setPhase('collect');
                }, 1500);
            } else {
                setLastResult(prediction === 'equal' ? 'equal-loss' : 'loss');
                addTransaction('loss', -bet, 'Hi-Lo');
                logBet('Hi-Lo', bet, 'loss', 0, { prediction, currentCard, next, streak });
                playLossStinger();
                setPhase('result');
                setModalData({ type: 'loss', amount: -bet, streak, next });
                setTimeout(() => setShowModal(true), 300);
            }
        }, 600);
    }, [phase, bet, balance, streak, pending, deck, deckIdx, currentCard, updateBalance, addTransaction, logBet]);

    // ── Collect winnings ─────────────────────
    const collect = useCallback(() => {
        const total = pending;
        updateBalance(total);
        addTransaction('win', total - bet, 'Hi-Lo');
        logBet('Hi-Lo', bet, 'win', total, { streak });
        unlockAchievement('first_win');
        if (balance + total >= 10000) unlockAchievement('balance_10k');
        setModalData({ type: 'win', amount: total, streak });
        setShowModal(true);
        setPhase('result');
    }, [pending, bet, streak, balance, updateBalance, addTransaction, logBet, unlockAchievement]);

    // ── Continue streak ──────────────────────
    const riskAgain = useCallback(() => {
        setPhase('betting');
    }, []);

    // ── Reset ────────────────────────────────
    const resetGame = useCallback(() => {
        setShowModal(false);
        setCurrentCard(null);
        setNextCard(null);
        setStreak(0);
        setPending(0);
        setLastResult(null);
        setPhase('start');
        setModalData(null);
    }, []);

    const currentMult = getMultiplier(streak);
    const nextMult = getMultiplier(streak + 1);

    return (
        <div className="hilo-container table-surface-spotlight table-felt-green">
            <Table>
                <main className="hilo-main">

                    {/* ── Start screen ── */}
                    {phase === 'start' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hilo-start-screen"
                        >
                            <div className="hilo-start-title">Hi · Lo</div>
                            <p className="hilo-start-sub">Predict the next card. Chain wins to multiply.</p>

                            <div className="hilo-mult-table">
                                {MULTIPLIER.slice(1).map((m, i) => (
                                    <div key={i} className="hilo-mult-row">
                                        <span className="hilo-mult-streak">{i + 1} win{i > 0 ? 's' : ''}</span>
                                        <span className="hilo-mult-value">{m}×</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-6">
                                <ChipSelector preset="high" selectedChip={bet} onSelectChip={setBet} idPrefix="hilo-start" />
                            </div>

                            <motion.button
                                id="hilo-start-btn"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startRound}
                                disabled={bet > balance}
                                className="hilo-deal-btn tactile-button tactile-button-gold"
                            >
                                Deal First Card
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Game arena ── */}
                    {phase !== 'start' && (
                        <div className="hilo-arena">

                            {/* Streak + multiplier badge */}
                            <div className="hilo-streak-bar">
                                <div className="hilo-streak-badge">
                                    <TrendingUp size={14} />
                                    Streak: <strong>{streak}</strong>
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentMult}
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="hilo-mult-badge"
                                    >
                                        {currentMult}×
                                    </motion.div>
                                </AnimatePresence>
                                {(phase === 'collect' || phase === 'reveal-win') && (
                                    <div className="hilo-pending-badge">
                                        ${pending.toLocaleString()} banked
                                    </div>
                                )}
                            </div>

                            {/* Cards row */}
                            <div className="hilo-cards-row">
                                {/* Current card */}
                                <div className="hilo-card-slot">
                                    <p className="hilo-card-label">Current</p>
                                    <AnimatePresence mode="wait">
                                        {currentCard && (
                                            <motion.div
                                                key={`${currentCard.suit}${currentCard.value}`}
                                                initial={{ rotateY: 90, opacity: 0 }}
                                                animate={{ rotateY: 0, opacity: 1 }}
                                                transition={{ duration: 0.35 }}
                                            >
                                                <Card suit={currentCard.suit} value={currentCard.value} isFaceUp />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* VS arrow */}
                                <div className="hilo-vs-area">
                                    <AnimatePresence>
                                        {lastResult && (
                                            <motion.div
                                                key={lastResult}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className={`hilo-result-icon ${lastResult.startsWith('equal') ? 'hilo-result-equal' : lastResult === 'win' ? 'hilo-result-win' : 'hilo-result-loss'}`}
                                            >
                                                {lastResult === 'win' ? '✓' : lastResult === 'loss' ? '✗' : '='}
                                            </motion.div>
                                        )}
                                        {!lastResult && <div className="hilo-vs-text">VS</div>}
                                    </AnimatePresence>
                                </div>

                                {/* Next card */}
                                <div className="hilo-card-slot">
                                    <p className="hilo-card-label">Next</p>
                                    <AnimatePresence mode="wait">
                                        {nextCard ? (
                                            <motion.div
                                                key={`next-${nextCard.suit}${nextCard.value}`}
                                                initial={{ rotateY: 90, opacity: 0 }}
                                                animate={{ rotateY: 0, opacity: 1 }}
                                                transition={{ duration: 0.35 }}
                                            >
                                                <Card suit={nextCard.suit} value={nextCard.value} isFaceUp />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="back">
                                                <Card suit="♠" value="A" isFaceUp={false} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* ── Betting controls ── */}
                            {phase === 'betting' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="hilo-controls"
                                >
                                    {streak === 0 && (
                                        <div className="mb-4">
                                            <ChipSelector preset="high" selectedChip={bet} onSelectChip={setBet} idPrefix="hilo" />
                                        </div>
                                    )}

                                    <div className="hilo-guess-btns">
                                        <motion.button
                                            id="hilo-btn-higher"
                                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                            onClick={() => guess('higher')}
                                            className="hilo-btn hilo-btn-higher"
                                        >
                                            <ArrowUp size={20} />
                                            Higher
                                        </motion.button>

                                        <motion.button
                                            id="hilo-btn-equal"
                                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                            onClick={() => guess('equal')}
                                            className="hilo-btn hilo-btn-equal"
                                        >
                                            <Equal size={18} />
                                            Equal
                                            <span className="hilo-btn-sub">8:1</span>
                                        </motion.button>

                                        <motion.button
                                            id="hilo-btn-lower"
                                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                            onClick={() => guess('lower')}
                                            className="hilo-btn hilo-btn-lower"
                                        >
                                            <ArrowDown size={20} />
                                            Lower
                                        </motion.button>
                                    </div>

                                    {streak > 0 && (
                                        <p className="hilo-next-mult-hint">
                                            Next win → <strong>{nextMult}×</strong> multiplier
                                        </p>
                                    )}
                                </motion.div>
                            )}




                            {/* ── Collect / Risk Again buttons (only in collect, not reveal-win) ── */}
                            {phase === 'collect' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="hilo-collect-area"
                                >
                                    <p className="hilo-collect-hint">
                                        {streak >= 4 ? '🔥 Max multiplier!' : `Next win = ${nextMult}×`}
                                    </p>
                                    <div className="hilo-collect-btns">
                                        <motion.button
                                            id="hilo-collect-btn"
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={collect}
                                            className="hilo-btn-collect tactile-button tactile-button-gold"
                                        >
                                            Collect ${pending.toLocaleString()}
                                        </motion.button>
                                        <motion.button
                                            id="hilo-risk-btn"
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={riskAgain}
                                            className="hilo-btn-risk tactile-button"
                                        >
                                            Risk Again →
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Reveal waiting / reveal-win glow state */}
                            {(phase === 'reveal' || phase === 'reveal-win') && (
                                <div className={`hilo-revealing ${phase === 'reveal-win' ? 'hilo-revealing-win' : ''}`}>
                                    {phase === 'reveal' ? (
                                        <>
                                            <span className="hilo-revealing-dot" />
                                            <span className="hilo-revealing-dot" style={{ animationDelay: '0.15s' }} />
                                            <span className="hilo-revealing-dot" style={{ animationDelay: '0.3s' }} />
                                        </>
                                    ) : (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="hilo-reveal-win-label"
                                        >
                                            ✓ Correct!
                                        </motion.span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <HowToPlay gameName="Hi-Lo" rules={HILO_RULES} steps={HILO_STEPS} tips={HILO_TIPS} />
                </main>
            </Table>

            {/* Result Modal */}
            <ResultModal
                isOpen={showModal}
                type={modalData?.type}
                title={modalData?.type === 'win'
                    ? (modalData.streak >= 3 ? '🔥 Hot Streak!' : 'Cashed Out!')
                    : 'Wrong Call!'}
                amount={modalData?.type === 'win'
                    ? `+$${modalData?.amount?.toLocaleString()}`
                    : `-$${bet}`}
                content={(
                    <div className="flex flex-col items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/50">
                        {modalData?.type === 'win'
                            ? <p>Streak: <span className="text-white">{modalData?.streak}</span></p>
                            : <p>Card was <span className="text-white">{modalData?.next?.value}{modalData?.next?.suit}</span></p>
                        }
                    </div>
                )}
                onPlayAgain={resetGame}
                playAgainLabel="New Round"
            />
        </div>
    );
}

export default HiLo;
