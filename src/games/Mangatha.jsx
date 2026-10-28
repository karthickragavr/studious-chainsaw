import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Card from '../components/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, PlusCircle, MinusCircle, ArrowLeft } from 'lucide-react';
import { useMangatha } from '../hooks/useMangatha';
import { useWallet } from '../hooks/useWallet';
import { useRoundGuard } from '../hooks/useRoundGuard';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import { ChipToken } from '../components/ChipSelector';
import ChipSelector from '../components/ChipSelector';
import confetti from 'canvas-confetti';
import { playWinJingle, playLossStinger } from '../utils/sounds';
import HowToPlay from '../components/HowToPlay';
import ResultModal from '../components/ResultModal';


const MANGATHA_RULES = [
    "Mangatha (Andar Bahar) is a classic Indian card game.",
    "A single joker card is drawn face-up in the center.",
    "Cards are dealt alternately to Andar (Inside/Ullae) and Bahar (Outside/Veliyae).",
    "The side where a card matching the joker's value appears first wins.",
    "If you bet on the winning side, you win 2x your bet.",
];

const MANGATHA_STEPS = [
    "Select your bet amount using the chips at the bottom.",
    "Choose a side: Ullae (Andar/Inside) or Veliyae (Bahar/Outside).",
    "Click 'Pick a Joker' to reveal the center card.",
    "Click 'Start Dealing' — cards are dealt to each side alternately.",
    "When a card matches the joker's value, that side wins!",
];

const MANGATHA_TIPS = [
    "Andar (Inside) has a slight statistical edge since it receives the first card.",
    "The game is pure luck — no strategy changes the outcome.",
    "Watch the cards carefully — the match can come at any time!",
];

function Mangatha() {
    const {
        joker, andarCards, baharCards, winner,
        phase, pickJoker, startDealing, resetGame
    } = useMangatha();

    const { balance: wallet, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [bet, setBet] = useState(100);
    const [side, setSide] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (phase === 'joker') {
            const timer = setTimeout(() => {
                startDealing();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [phase, startDealing]);

    useEffect(() => {
        if (phase === 'result') {
            setShowResult(true);
        } else {
            setShowResult(false);
        }
    }, [phase]);

    useEffect(() => {
        if (winner && phase === 'result') {
            if (winner === side) {
                updateBalance(bet * 2);
                addTransaction('win', bet, 'Mangatha');
                logBet('Mangatha', bet, 'win', bet * 2, { side, winner });
                unlockAchievement('first_win');
                playWinJingle();
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f59e0b', '#fbbf24', '#ffffff']
                });
            } else {
                addTransaction('loss', -bet, 'Mangatha');
                logBet('Mangatha', bet, 'loss', 0, { side, winner });
                playLossStinger();
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            }
            if (wallet >= 10000) unlockAchievement('balance_10k');
        }
    }, [winner, phase, side, bet]);

    const handleStart = () => {
        if (wallet < bet || !side) return;
        updateBalance(-bet);
        setShowResult(false);
        pickJoker();
    };

    const resetBettingState = () => {
        setShowResult(false);
        resetGame();
        setSide(null);
    };

    // Hand the stake back if the player leaves before this round settles
    const stakeAtRisk = ['joker', 'dealing'].includes(phase) ? bet : 0;
    useRoundGuard('Mangatha', stakeAtRisk);

    return (
        <div className={`mangatha-container table-surface-spotlight table-felt-red ${isShaking ? 'shake-effect' : ''}`}>
            <Table>
                <main className="mangatha-main-area">

                    {/* Game Arena */}
                    <div className="mangatha-arena">
                        {/* Andar Section */}
                        <div className="mangatha-side-section mangatha-side-order-andar">
                            <motion.div
                                id="mangatha-bet-andar"
                                whileHover={phase === 'betting' ? { scale: 1.05 } : {}}
                                onClick={() => phase === 'betting' && setSide('andar')}
                                className={`mangatha-bet-panel ${side === 'andar' ? 'mangatha-bet-panel-selected' : 'mangatha-bet-panel-default'} ${phase !== 'betting' && side !== 'andar' ? 'mangatha-bet-panel-disabled' : ''}`}
                            >
                                <span className={`mangatha-bet-label ${side === 'andar' ? 'mangatha-bet-label-selected' : ''}`}>Ullae (Inside)</span>
                                <div className="mangatha-bet-multiplier">2x</div>

                                {side === 'andar' && (
                                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ x: '-50%' }} className="mangatha-chip-container">
                                        <ChipToken value={bet} color="#f59e0b" scale={0.8} disabled />
                                    </motion.div>
                                )}
                            </motion.div>

                            <div className="mangatha-cards-area">
                                <AnimatePresence>
                                    {andarCards.map((card, index) => (
                                        <motion.div
                                            key={card.id}
                                            initial={{ x: 200, y: -200, rotate: 180, opacity: 0, scale: 0.5 }}
                                            animate={{ x: (index % 5) * 15 - 30, y: Math.floor(index / 5) * 12, rotate: (index % 3) * 4 - 2, opacity: 1, scale: 1 }}
                                            className="absolute"
                                            style={{ zIndex: index }}
                                        >
                                            <Card suit={card.suit} value={card.value} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Dealer Area */}
                        <div className="mangatha-center-section">
                            <div className="mangatha-joker-container">
                                <span className="mangatha-joker-label">The Joker</span>
                                <div className="mangatha-joker-wrapper">
                                    <AnimatePresence mode="wait">
                                        {joker ? (
                                            <motion.div key="joker-card" initial={{ rotateY: 180, scale: 0.8, opacity: 0 }} animate={{ rotateY: 0, scale: 1.1, opacity: 1 }} className="mangatha-joker-card-active">
                                                <Card suit={joker.suit} value={joker.value} />
                                            </motion.div>
                                        ) : (
                                            <div className="mangatha-joker-card-placeholder">
                                                <Card suit="♠" value="?" isFaceUp={false} />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mangatha-deck-area">
                                <Card suit="♠" value="?" isFaceUp={false} />
                            </div>
                        </div>

                        {/* Bahar Section */}
                        <div className="mangatha-side-section mangatha-side-order-bahar">
                            <motion.div
                                id="mangatha-bet-bahar"
                                whileHover={phase === 'betting' ? { scale: 1.05 } : {}}
                                onClick={() => phase === 'betting' && setSide('bahar')}
                                className={`mangatha-bet-panel ${side === 'bahar' ? 'mangatha-bet-panel-selected' : 'mangatha-bet-panel-default'} ${phase !== 'betting' && side !== 'bahar' ? 'mangatha-bet-panel-disabled' : ''}`}
                            >
                                <span className={`mangatha-bet-label ${side === 'bahar' ? 'mangatha-bet-label-selected' : ''}`}>Veliyae (Outside)</span>
                                <div className="mangatha-bet-multiplier">2x</div>
                                {side === 'bahar' && (
                                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ x: '-50%' }} className="mangatha-chip-container">
                                        <ChipToken value={bet} color="#f59e0b" scale={0.8} disabled />
                                    </motion.div>
                                )}
                            </motion.div>

                            <div className="mangatha-cards-area">
                                <AnimatePresence>
                                    {baharCards.map((card, index) => (
                                        <motion.div
                                            key={card.id}
                                            initial={{ x: -200, y: -200, rotate: -180, opacity: 0, scale: 0.5 }}
                                            animate={{ x: (index % 5) * 15 - 30, y: Math.floor(index / 5) * 12, rotate: (index % 3) * 4 - 2, opacity: 1, scale: 1 }}
                                            className="absolute"
                                            style={{ zIndex: index }}
                                        >
                                            <Card suit={card.suit} value={card.value} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Betting Panel */}
                    {phase === 'betting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-md mx-auto mt-8 flex flex-col items-center bg-black/40 p-6 rounded-3xl border border-white/10 backdrop-blur-sm"
                        >
                            <div className="text-center mb-6">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Your Bet</span>
                                <span className="text-3xl font-black font-mono text-amber-400 drop-shadow-md">${bet}</span>
                            </div>

                            <div className="scale-100 sm:scale-110 mb-8 w-full flex justify-center">
                                <ChipSelector
                                    preset="high"
                                    selectedChip={bet}
                                    onSelectChip={setBet}
                                    idPrefix="mangatha"
                                />
                            </div>

                            <button
                                onClick={handleStart}
                                disabled={!side || bet > wallet}
                                className={`tactile-button tactile-button-gold w-full md:w-64 py-4 text-xl ${(!side || bet > wallet) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {bet > wallet ? 'Insufficient Funds' : side ? 'DEAL CARDS' : 'SELECT A SIDE'}
                            </button>
                        </motion.div>
                    )}

                    <HowToPlay gameName="Mangatha" rules={MANGATHA_RULES} steps={MANGATHA_STEPS} tips={MANGATHA_TIPS} />
                </main>
            </Table>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                type={winner === side ? 'win' : 'loss'}
                title={winner === side ? 'Royale Win!' : 'House Wins'}
                amount={winner === side ? `+$${bet * 2}` : `-$${bet}`}
                content={(
                    <div className="flex flex-col items-center">
                        <p className="text-lg opacity-80">Joker: {joker?.value} of {joker?.suit}</p>
                        <p className="text-sm mt-2 font-bold uppercase tracking-widest text-white/50">
                            Winning Side: <span className="text-white">{winner === 'andar' ? 'Ullae (Inside)' : 'Veliyae (Outside)'}</span>
                        </p>
                    </div>
                )}
                onPlayAgain={resetBettingState}
            />


        </div >
    );
}

export default Mangatha;
