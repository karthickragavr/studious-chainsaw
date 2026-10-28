import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCraps } from '../hooks/useCraps';
import { useWallet } from '../hooks/useWallet';
import { useRoundGuard } from '../hooks/useRoundGuard';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import HowToPlay from '../components/HowToPlay';
import Chip from '../components/Chip';
import { playChipClick, playWinJingle, playLossStinger, playShuffle } from '../utils/sounds';
import confetti from 'canvas-confetti';
import ResultModal from '../components/ResultModal';

const CRAPS_RULES = [
    "Craps is a dice game where players bet on the outcome of a pair of dice.",
    "Come-out roll: 7 or 11 wins (Pass Line), 2, 3, or 12 loses (Craps).",
    "Any other number establishes a 'Point'.",
    "Once a Point is set, roll that number again before a 7 to win (Seven-out loses).",
    "Field is a one-roll bet: wins on 2, 3, 4, 9, 10, 11, 12. Pays 2:1 (3:1 on 2 or 12).",
];

const CRAPS_STEPS = [
    "Select a chip value.",
    "Place a bet on the Pass Line (and optionally the Field).",
    "Click 'Roll' for the Come-out roll.",
    "If a Point is set, keep rolling until you hit the Point or a 7.",
];

const CRAPS_TIPS = [
    "The Pass Line bet has a low house edge of 1.41%.",
    "The Field bet resolves on every single roll — win or lose.",
    "Once the Point is ON, your Pass Line bet is locked in until the round ends.",
];

const DICE_DOTS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8],
    4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

const Die = ({ value, rolling }) => (
    <motion.div
        animate={rolling ? {
            rotate: [0, 90, 180, 270, 360],
            x: [0, -12, 12, -8, 8, 0],
            y: [0, -16, 16, -8, 8, 0],
        } : { rotate: 0, x: 0, y: 0 }}
        transition={rolling ? { duration: 0.4, repeat: Infinity } : { duration: 0.4 }}
        className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-lg md:rounded-xl shadow-xl border-b-4 border-slate-300 flex items-center justify-center p-1.5 md:p-2"
    >
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    {DICE_DOTS[value]?.includes(i) && (
                        <div className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full shadow-inner ${value === 1 ? 'bg-red-600' : 'bg-slate-900'}`} />
                    )}
                </div>
            ))}
        </div>
    </motion.div>
);

function Craps() {
    const {
        phase, dice, point, bets, lastWinnings, rollHistory, interimWin,
        placeBet, clearBets, getTotalBet, roll, nextRound, acknowledgeInterimWin,
    } = useCraps();

    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [selectedChip, setSelectedChip] = useState(10);
    const [showResult, setShowResult] = useState(false);
    const [fieldFlash, setFieldFlash] = useState(null);

    const chipValues = [
        { value: 10, color: '#ef4444' },
        { value: 25, color: '#3b82f6' },
        { value: 50, color: '#10b981' },
        { value: 100, color: '#8b5cf6' },
    ];

    const totalBet = getTotalBet();
    const lockedPass = phase === 'point' ? (bets.pass || 0) : 0;

    const handlePlaceBet = (betType) => {
        if (phase === 'rolling' || phase === 'result') return;
        if (betType === 'pass' && phase !== 'come-out') return;
        if (selectedChip > balance) return;

        if (placeBet(betType, selectedChip)) {
            updateBalance(-selectedChip);
            playChipClick();
        }
    };

    const handleClear = () => {
        const refund = totalBet - lockedPass;
        if (refund > 0) updateBalance(refund);
        clearBets();
        playChipClick();
    };

    const handleRoll = () => {
        if (totalBet === 0) return;
        playShuffle();
        roll();
    };

    // Field bet paying out mid-round (point continues, no result screen)
    useEffect(() => {
        if (interimWin) {
            updateBalance(interimWin.amount);
            addTransaction('win', interimWin.amount, 'Craps');
            logBet('Craps', interimWin.amount / 2, 'win', interimWin.amount, { bet: 'field', sum: interimWin.sum });
            playWinJingle();
            setFieldFlash(interimWin.amount);
            acknowledgeInterimWin();
        }
    }, [interimWin]);

    // Separate from the payout effect above: acknowledging the win changes
    // interimWin, and a cleanup there would cancel the timer that hides this.
    useEffect(() => {
        if (fieldFlash === null) return;
        const t = setTimeout(() => setFieldFlash(null), 2200);
        return () => clearTimeout(t);
    }, [fieldFlash]);

    // Round resolved (pass line won or lost)
    useEffect(() => {
        if (phase === 'result') {
            const timer = setTimeout(() => {
                if (lastWinnings > 0) {
                    updateBalance(lastWinnings);
                    addTransaction('win', lastWinnings - totalBet, 'Craps');
                    logBet('Craps', totalBet, 'win', lastWinnings, { dice });
                    unlockAchievement('first_win');
                    playWinJingle();
                    confetti({ particleCount: 120, spread: 60, origin: { y: 0.7 } });
                } else {
                    addTransaction('loss', -totalBet, 'Craps');
                    logBet('Craps', totalBet, 'loss', 0, { dice });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [phase, lastWinnings]);

    const handleNewRound = () => {
        setShowResult(false);
        nextRound();
    };

    // Hand the stake back if the player leaves before this round settles
    const stakeAtRisk = phase === 'result' && showResult ? 0 : totalBet;
    useRoundGuard('Craps', stakeAtRisk);

    return (
        <div className="roulette-container table-felt-green table-surface-spotlight">
            <div className="roulette-main-area">

                {/* Header + point marker */}
                <div className="w-full flex flex-wrap justify-between items-center gap-3 mb-6 max-w-2xl px-2 box-border mx-auto">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 uppercase tracking-wider">Craps</h1>
                        {rollHistory.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                                {rollHistory.map((r, i) => (
                                    <div key={i} className="w-6 h-6 rounded bg-black/40 flex items-center justify-center text-[10px] font-bold border border-white/10 text-white/70">{r}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 md:gap-3">
                        <div className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-w-[64px] ${point ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-black/40 border-white/10 text-white/40'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">Point</span>
                            <span className="text-xl md:text-2xl font-black">{point || '—'}</span>
                        </div>
                        <div className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[64px] ${point ? 'bg-emerald-600/80 border-emerald-300 text-white' : 'bg-black/40 border-white/10 text-white/60'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">Puck</span>
                            <span className="text-sm md:text-base font-black">{point ? 'ON' : 'OFF'}</span>
                        </div>
                    </div>
                </div>

                {/* Dice area */}
                <div className="sicbo-dice-area relative">
                    <div className="sicbo-dice-spotlight"></div>
                    <div className="flex gap-4 md:gap-6 relative z-10 items-center justify-center">
                        <Die value={dice[0]} rolling={phase === 'rolling'} />
                        <Die value={dice[1]} rolling={phase === 'rolling'} />
                    </div>
                    <AnimatePresence>
                        {fieldFlash && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ x: '-50%' }}
                                className="absolute bottom-2 left-1/2 bg-blue-500 text-white px-4 py-1 rounded-full font-black text-sm shadow-xl z-20 whitespace-nowrap"
                            >
                                FIELD PAYS +${fieldFlash}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Betting layout */}
                <div className="sicbo-betting-container">
                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 md:gap-3 px-2 box-border">
                        {/* Pass Line */}
                        <button
                            onClick={() => handlePlaceBet('pass')}
                            disabled={phase === 'rolling' || phase === 'result' || phase === 'point'}
                            className={`relative w-full min-h-[64px] md:min-h-[72px] rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-2 transition-all ${bets.pass ? 'border-amber-400 bg-amber-400/10 shadow-[inset_0_0_20px_rgba(251,191,36,0.15)]' : 'bg-emerald-900/50 border-emerald-500/30 hover:border-white/30'} ${phase === 'point' && !bets.pass ? 'opacity-40' : ''}`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-lg md:text-2xl font-black italic tracking-widest text-white">PASS LINE</span>
                                <span className="text-[10px] font-bold text-emerald-400">PAYS 1:1{phase === 'point' && bets.pass ? ' · LOCKED' : ''}</span>
                            </div>
                            {bets.pass > 0 && (
                                <div className="bg-amber-400 text-black px-3 py-1.5 rounded-xl font-black shadow-lg text-sm md:text-base">${bets.pass}</div>
                            )}
                        </button>

                        {/* Field */}
                        <button
                            onClick={() => handlePlaceBet('field')}
                            disabled={phase === 'rolling' || phase === 'result'}
                            className={`relative w-full min-h-[64px] md:min-h-[72px] rounded-2xl border-2 flex flex-wrap items-center justify-center gap-2 md:gap-4 px-3 py-2 transition-all ${bets.field ? 'border-blue-400 bg-blue-400/10 shadow-[inset_0_0_20px_rgba(96,165,250,0.15)]' : 'bg-blue-900/40 border-blue-500/30 hover:border-white/30'}`}
                        >
                            <span className="text-base md:text-xl font-black tracking-widest text-white">FIELD</span>
                            <div className="flex gap-1 md:gap-1.5 flex-wrap justify-center">
                                {[2, 3, 4, 9, 10, 11, 12].map(n => (
                                    <span key={n} className={`w-6 h-6 md:w-7 md:h-7 rounded-lg border flex items-center justify-center text-[10px] md:text-xs font-bold ${n === 2 || n === 12 ? 'text-blue-300 border-blue-400/40' : 'text-white/60 border-white/10'}`}>{n}</span>
                                ))}
                            </div>
                            <span className="text-[9px] font-bold text-blue-300 w-full md:w-auto">ONE ROLL · 2:1 (2 &amp; 12 PAY 3:1)</span>
                            {bets.field > 0 && (
                                <div className="absolute -top-2 -right-2 bg-blue-400 text-black text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg">${bets.field}</div>
                            )}
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="roulette-controls-panel !max-w-4xl mx-auto mt-6">
                        <div className="roulette-chips-container flex-wrap justify-center items-center gap-3 md:gap-4 scale-90 md:scale-100">
                            {chipValues.map(({ value, color }) => (
                                <Chip
                                    id={`craps-chip-${value}`}
                                    key={value}
                                    value={value}
                                    color={color}
                                    isSelected={selectedChip === value}
                                    onClick={() => { setSelectedChip(value); playChipClick(); }}
                                />
                            ))}
                        </div>

                        <div className="roulette-info-spin-container flex-wrap justify-center">
                            <div className="roulette-total-bet-display min-w-[140px] flex flex-col items-center justify-center text-center">
                                <span className="roulette-total-bet-label">{point ? 'At Stake' : 'Total Bet'}</span>
                                <span className="roulette-total-bet-amount">${totalBet}</span>
                            </div>

                            <div className="roulette-action-buttons">
                                <button
                                    onClick={handleClear}
                                    disabled={phase === 'rolling' || totalBet - lockedPass === 0}
                                    className="roulette-clear-btn tactile-button whitespace-nowrap"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleRoll}
                                    disabled={phase === 'rolling' || phase === 'result' || totalBet === 0}
                                    className="roulette-spin-btn tactile-button whitespace-nowrap w-auto"
                                >
                                    {phase === 'point' ? 'ROLL FOR POINT' : 'ROLL'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result modal */}
                <ResultModal
                    isOpen={showResult}
                    type={lastWinnings > 0 ? 'win' : 'loss'}
                    title={lastWinnings > 0 ? 'You Won!' : (dice[0] + dice[1] === 7 ? 'Seven-Out' : 'Craps!')}
                    amount={lastWinnings > 0 ? `+$${lastWinnings}` : `-$${totalBet}`}
                    content={(
                        <div className="flex flex-col items-center">
                            <p className="text-lg opacity-80">Final Roll</p>
                            <div className="flex gap-3 mt-4">
                                <Die value={dice[0]} rolling={false} />
                                <Die value={dice[1]} rolling={false} />
                            </div>
                            <p className="text-sm mt-4 font-bold uppercase tracking-widest text-white/50">
                                Sum: <span className="text-white">{dice[0] + dice[1]}</span>
                            </p>
                        </div>
                    )}
                    onPlayAgain={handleNewRound}
                />

                <HowToPlay gameName="Craps" rules={CRAPS_RULES} steps={CRAPS_STEPS} tips={CRAPS_TIPS} />
            </div>
        </div>
    );
}

export default Craps;
