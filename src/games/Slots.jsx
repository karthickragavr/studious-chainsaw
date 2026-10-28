import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSlots, SLOT_SYMBOLS, SLOT_PAYOUTS } from '../hooks/useSlots';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import ChipSelector from '../components/ChipSelector';
import HowToPlay from '../components/HowToPlay';
import { playWinJingle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';
import ResultModal from '../components/ResultModal';


const SLOTS_RULES = [
    "Match 3 identical symbols across the reels to win.",
    "7️⃣ 7️⃣ 7️⃣ is the jackpot — pays 50x your bet!",
    "💎 💎 💎 pays 25x, 🔔 🔔 🔔 pays 10x.",
    "🍋 🍋 🍋 pays 5x, 🍒 🍒 🍒 pays 3x.",
    "Two 🍒 anywhere on the reels pays 2x.",
];

const SLOTS_STEPS = [
    "Choose your bet amount using the chips.",
    "Press the SPIN button to start the reels.",
    "Watch each reel stop one by one from left to right.",
    "If the symbols match, you win based on the pay table!",
];

const SLOTS_TIPS = [
    "The jackpot 7️⃣ has equal odds but the biggest payout.",
    "Two cherries give a small payout — keep spinning!",
    "Set a budget and stick to it for the best experience.",
];

function Slots() {
    const { reels, phase, spinning, result, spin, resetGame } = useSlots();
    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();
    const [bet, setBet] = useState(1);
    const [showResult, setShowResult] = useState(false);
    const [winAmount, setWinAmount] = useState(0);

    const handleSpin = () => {
        if (bet > balance || phase === 'spinning') return;
        // Enforce max bet of $10 just in case
        if (bet > 10) {
            setBet(10);
            return;
        }
        updateBalance(-bet);
        setShowResult(false);
        setWinAmount(0);
        spin();
    };

    useEffect(() => {
        if (phase === 'result' && result) {
            const timer = setTimeout(() => {
                if (result.multiplier > 0) {
                    const won = bet * result.multiplier;
                    setWinAmount(won);
                    updateBalance(won);
                    addTransaction('win', won - bet, 'Slots');
                    logBet('Slots', bet, 'win', won, { symbol: result.symbol, match: result.match });
                    unlockAchievement('first_win');
                    if (result.symbol === '7️⃣' && result.match === 'three') unlockAchievement('slots_jackpot');
                    playWinJingle();
                    if (result.multiplier >= 10) {
                        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
                    } else {
                        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
                    }
                } else {
                    addTransaction('loss', -bet, 'Slots');
                    logBet('Slots', bet, 'loss', 0, { symbol: result.symbol });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [phase, result]);

    const handlePlayAgain = () => {
        setShowResult(false);
        setWinAmount(0);
        resetGame();
    };

    // Animation symbols for spinning reels
    const spinSymbols = ['🍒', '💎', '7️⃣', '🔔', '🍋'];

    return (
        <div className="slots-container">
            {/* Slot Machine Physical Cabinet */}
            <div className="machine-frame max-w-2xl mx-auto">
                <div className="slots-main-area align-justify p-2 sm:p-4">
                    {/* Title Cabinet Header */}
                    <div className="slots-header mb-4 sm:mb-8">
                        <h2 className="slots-title text-2xl sm:text-4xl font-black italic tracking-tighter text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            LUCKY SLOTS
                        </h2>
                        <div className="h-1 w-24 sm:w-32 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-1" />
                    </div>

                    {/* High-Definition LED Screen */}
                    <div className="machine-screen mb-6 sm:mb-10">
                        <div className="machine-screen-reflection" />

                        <div className="slots-reels-container p-2 md:p-8 relative z-10">
                            <div className="slots-reels-grid flex justify-center gap-1 md:gap-4">
                                {reels.map((symbol, i) => (
                                    <div
                                        key={i}
                                        className="slots-reel-wrapper bg-black/40 rounded-xl h-32 md:h-48 w-20 md:w-24 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner"
                                    >
                                        {spinning[i] ? (
                                            <motion.div
                                                className="slots-reel-spinning flex flex-col items-center"
                                                animate={{ y: [0, -200] }}
                                                transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
                                            >
                                                {[...spinSymbols, ...spinSymbols].map((s, j) => (
                                                    <span key={j} className="slots-reel-symbol text-4xl md:text-6xl my-2 md:my-4 drop-shadow-lg">{s}</span>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.span
                                                className="slots-reel-symbol-static text-5xl md:text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', damping: 10 }}
                                            >
                                                {symbol}
                                            </motion.span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Win Line LED Glow */}
                            <div className="slots-win-line-container absolute inset-0 flex items-center pointer-events-none px-4">
                                <div className="slots-win-line w-full h-1 bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.5)] blur-[1px]" />
                            </div>
                        </div>
                    </div>

                    {/* Physical Control Panel */}
                    <div className="slots-controls-panel bg-black/20 p-6 rounded-3xl border border-white/5 shadow-2xl">
                        <ChipSelector
                            preset="low"
                            selectedChip={bet}
                            onSelectChip={setBet}
                            disabled={phase === 'spinning'}
                            idPrefix="slots"
                        />

                        <div className="slots-bet-display my-6 flex items-center justify-center gap-3">
                            <span className="slots-bet-label text-sm font-bold uppercase tracking-widest text-amber-400 opacity-50">Total Bet:</span>
                            <span className="slots-bet-amount text-3xl font-black font-mono text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">${bet}</span>
                        </div>

                        {/* Large Tactile Spin Button */}
                        <button
                            id="slots-spin-btn"
                            onClick={handleSpin}
                            disabled={phase === 'spinning' || bet > balance}
                            className={`slots-spin-btn tactile-button ${result?.multiplier >= 10 ? 'tactile-button-gold' : 'tactile-button-red'} w-full py-6 text-2xl mb-8`}
                        >
                            {phase === 'spinning' ? 'SPINNING...' : 'SPIN'}
                        </button>

                        {/* Compact Pay Table on the machine face */}
                        <div className="slots-paytable-container border-t border-white/5 pt-6">
                            <h4 className="slots-paytable-title text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4">Payout Schedule</h4>
                            <div className="slots-paytable-grid grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] font-bold opacity-60">
                                {Object.entries(SLOT_PAYOUTS).reverse().map(([sym, data]) => (
                                    <div key={sym} className="slots-paytable-item flex justify-between uppercase tracking-tighter">
                                        <span>{sym}{sym}{sym}</span>
                                        <span className="slots-paytable-multiplier text-amber-500">{data.three}x</span>
                                    </div>
                                ))}
                                <div className="slots-paytable-item flex justify-between uppercase tracking-tighter">
                                    <span>🍒🍒 ANY</span>
                                    <span className="slots-paytable-multiplier text-amber-500">2x</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult && result?.multiplier > 0}
                type="win"
                title={result?.multiplier >= 25 ? 'JACKPOT!' : 'BIG WIN!'}
                amount={`+$${winAmount}`}
                content={(
                    <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4 drop-shadow-2xl">{result?.symbol}{result?.symbol}{result?.symbol}</div>
                        <p className="text-sm font-bold uppercase tracking-widest text-white/50">
                            {result?.multiplier}x Multiplier
                        </p>
                    </div>
                )}
                onPlayAgain={handlePlayAgain}
                playAgainLabel="Continue"
            />

            <HowToPlay gameName="Slots" rules={SLOTS_RULES} steps={SLOTS_STEPS} tips={SLOTS_TIPS} />
        </div>
    );

}

export default Slots;
