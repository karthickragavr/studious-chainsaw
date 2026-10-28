import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSicBo } from '../hooks/useSicBo';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import HowToPlay from '../components/HowToPlay';
import Chip from '../components/Chip';
import { playChipClick, playWinJingle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';
import ResultModal from '../components/ResultModal';


const SICBO_RULES = [
    "Sic Bo is played with three dice.",
    "Place bets on the outcome of the roll.",
    "Small: Sum is 4-10 (excludes triples). Pays 1:1.",
    "Big: Sum is 11-17 (excludes triples). Pays 1:1.",
    "Specific Triples pay 180:1, Any Triple pays 30:1.",
    "Specific Sums pay between 6:1 and 60:1."
];

const SICBO_STEPS = [
    "Select a chip value.",
    "Click on the betting board to place your bets.",
    "Click 'Roll Dice' to start.",
    "Winnings are calculated automatically."
];

const SICBO_TIPS = [
    "Small and Big are the safest bets with a nearly 50% chance of winning.",
    "Triples offer huge payouts but are very risky.",
    "You can place multiple bets per roll."
];

function SicBo() {
    const {
        phase, dice, bets, placeBet, removeBet, clearBets, getTotalBet, roll, calculateWinnings, resetGame
    } = useSicBo();

    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [selectedChip, setSelectedChip] = useState(10);
    const [showResult, setShowResult] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [isEraseMode, setIsEraseMode] = useState(false);

    const chipValues = [
        { value: 10, color: '#ef4444' },
        { value: 25, color: '#3b82f6' },
        { value: 50, color: '#10b981' },
        { value: 100, color: '#8b5cf6' },
    ];

    const handlePlaceBet = (betType) => {
        if (phase !== 'betting') return;

        if (isEraseMode) {
            if (bets[betType] > 0) {
                updateBalance(bets[betType]);
                removeBet(betType);
                playChipClick();
            }
            return;
        }

        if (selectedChip > balance) return;
        updateBalance(-selectedChip);
        placeBet(betType, selectedChip);
        playChipClick();
    };

    const handleClear = () => {
        const refund = getTotalBet();
        if (refund > 0) updateBalance(refund);
        clearBets();
        playChipClick();
    };

    const handleRoll = () => {
        if (getTotalBet() === 0) return;
        roll();
        // Option to add dice roll sound here
    };

    const totalBet = getTotalBet();

    useEffect(() => {
        if (phase === 'result' && dice) {
            const timer = setTimeout(() => {
                const winnings = calculateWinnings();
                setWinAmount(winnings);
                if (winnings > 0) {
                    updateBalance(winnings);
                    addTransaction('win', winnings - totalBet, 'SicBo');
                    logBet('SicBo', totalBet, 'win', winnings, { dice });
                    unlockAchievement('first_win');
                    playWinJingle();
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } else {
                    addTransaction('loss', -totalBet, 'SicBo');
                    logBet('SicBo', totalBet, 'loss', 0, { dice });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [phase, dice]);

    const handleNewRound = () => {
        setShowResult(false);
        setWinAmount(0);
        resetGame();
    };

    const renderDiceDots = (value, size = 'large') => {
        let dotSize = 'w-1 h-1 md:w-1.5 md:h-1.5';
        if (size === 'medium') dotSize = 'w-1.5 h-1.5 md:w-2 md:h-2';
        if (size === 'large') dotSize = 'w-2.5 h-2.5 md:w-3 md:h-3';

        const dotColor = (value === 1 || value === 4) ? 'bg-red-600' : 'bg-slate-900';
        const dotStyle = `${dotSize} ${dotColor} rounded-full shadow-inner`;

        const gridMap = {
            1: [4],
            2: [0, 8],
            3: [0, 4, 8],
            4: [0, 2, 6, 8],
            5: [0, 2, 4, 6, 8],
            6: [0, 3, 6, 2, 5, 8]
        };

        if (value >= 1 && value <= 6) {
            return (
                <div className={`grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5 md:gap-1 p-0.5 md:p-1 ${size === 'large' ? 'md:p-2.5' : ''}`}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="flex justify-center items-center">
                            {gridMap[value].includes(i) && <div className={dotStyle} />}
                        </div>
                    ))}
                </div>
            );
        }

        const textSize = size === 'small' ? 'text-[8px] md:text-xs' : size === 'medium' ? 'text-xs md:text-sm' : 'text-xl md:text-3xl';
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className={`${textSize} font-black text-gray-400 opacity-50`}>?</span>
            </div>
        );
    };

    const renderMiniDice = (value, count, size = 'small') => {
        return (
            <div className={`flex gap-0.5 md:gap-1 justify-center items-center ${size === 'medium' ? 'mb-2' : 'mb-1'}`}>
                {Array(count).fill(value).map((v, i) => (
                    <div key={i} className={`${size === 'small' ? 'w-5 h-5 md:w-7 md:h-7' : 'w-7 h-7 md:w-10 md:h-10'} bg-white rounded-sm md:rounded shadow-sm border-b-2 border-slate-300 flex items-center justify-center overflow-hidden`}>
                        {renderDiceDots(v, size)}
                    </div>
                ))}
            </div>
        );
    };

    const renderBetButton = (betKey, label, multiplier, bgClass = 'bg-gray-800 hover:bg-gray-700', children = null) => (
        <button
            onClick={() => handlePlaceBet(betKey)}
            disabled={phase !== 'betting'}
            className={`relative flex flex-col items-center justify-center p-2 md:p-3 rounded-xl border-2 transition-all min-w-0 ${bgClass} ${bets[betKey] ? 'border-amber-400 z-10 scale-[1.03] shadow-xl' : 'border-white/10 hover:border-white/30'}`}
        >
            {children}
            {label && <span className="font-bold text-white mb-0.5 leading-tight text-[10px] md:text-xs text-center break-words max-w-full">{label}</span>}
            <span className="text-[9px] md:text-xs text-amber-400 font-medium text-center break-words max-w-full">{multiplier}</span>
            {bets[betKey] > 0 && (
                <div className={`absolute -top-2 -right-2 ${isEraseMode ? 'bg-red-500 scale-110 animate-pulse' : 'bg-amber-500'} text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-20`}>
                    ${bets[betKey]}
                </div>
            )}
        </button>
    );

    return (
        <div className="roulette-container table-felt-green table-surface-spotlight">
            <div className="roulette-main-area">

                {/* Information Header */}
                <div className="w-full flex justify-between items-center mb-6 max-w-2xl px-2 box-border mx-auto">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 uppercase tracking-wider">Sic Bo</h1>
                    </div>
                </div>

                {/* Dice Display Section */}
                <div className="sicbo-dice-area">
                    <div className="sicbo-dice-spotlight"></div>
                    {[0, 1, 2].map(idx => (
                        <motion.div
                            key={idx}
                            animate={phase === 'rolling' ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.5, repeat: phase === 'rolling' ? 5 : 0 }}
                            className="sicbo-dice-physical"
                        >
                            {phase === 'betting' ? renderDiceDots('?') : (dice ? renderDiceDots(dice[idx]) : renderDiceDots('?'))}
                        </motion.div>
                    ))}
                </div>

                {/* Betting Board Wrapper */}
                <div className="sicbo-betting-container">
                    <div className="sicbo-bet-grid">
                        {/* Top Row: Small / Big */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            {renderBetButton('small', 'SMALL', '1:1', 'bg-blue-900/60 border-blue-500/30 hover:bg-blue-800/80', <span className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">Under 11</span>)}
                            {renderBetButton('big', 'BIG', '1:1', 'bg-red-900/60 border-red-500/30 hover:bg-red-800/80', <span className="text-[10px] text-red-300 uppercase tracking-widest mb-1">Over 10</span>)}
                        </div>

                        {/* Any Triple */}
                        <div className="grid grid-cols-1 w-full box-border">
                            {renderBetButton('any-triple', 'ANY TRIPLE', '30:1', 'sicbo-sum-btn w-full bg-amber-900/60 border-amber-500/30 hover:bg-amber-800/80 py-3',
                                <div className="h-6 w-full flex items-center justify-center pointer-events-none">
                                    {renderMiniDice('?', 3, 'small')}
                                </div>
                            )}
                        </div>
                        {/* Specific Triples */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
                            {[1, 2, 3].map(n => renderBetButton(`triple-${n}`, '', '180:1', 'bg-slate-800/60 hover:bg-slate-700/80 py-3', renderMiniDice(n, 3, 'small')))}
                            {[4, 5, 6].map(n => renderBetButton(`triple-${n}`, '', '180:1', 'bg-slate-800/60 hover:bg-slate-700/80 py-3', renderMiniDice(n, 3, 'small')))}
                        </div>

                        {/* Specific Doubles */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
                            {[1, 2, 3, 4, 5, 6].map(n => renderBetButton(`double-${n}`, '', '10:1', 'bg-slate-800/60 hover:bg-slate-700/80 py-3', renderMiniDice(n, 2, 'small')))}
                        </div>

                        {/* Sums */}
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 md:gap-2">
                            {[4, 5, 6, 7, 8, 9, 10].map(sum => (
                                <div key={sum} className={sum === 10 ? "col-span-2 md:col-span-1" : "col-span-1"}>
                                    {renderBetButton(`sum-${sum}`, `${sum}`,
                                        sum === 4 ? '60:1' : sum === 5 ? '30:1' : sum === 6 ? '18:1' : sum === 7 ? '12:1' : sum === 8 ? '8:1' : '6:1',
                                        'sicbo-sum-btn w-full h-full py-2.5',
                                        <span className="text-[8px] font-bold tracking-widest text-emerald-300/80 mb-0.5">SUM</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Single Numbers */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
                            {[1, 2, 3, 4, 5, 6].map(n => renderBetButton(`single-${n}`, '', '1x, 2x, 3x', 'bg-slate-800/60 hover:bg-slate-700/80 py-3', renderMiniDice(n, 1, 'medium')))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="roulette-controls-panel !max-w-4xl mx-auto mt-6">
                        {/* Chips */}
                        <div className="roulette-chips-container flex-wrap justify-center items-center gap-3 md:gap-4 scale-90 md:scale-100">
                            <button
                                onClick={() => setIsEraseMode(!isEraseMode)}
                                className={`tactile-button ${isEraseMode ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.6)] text-white' : 'bg-slate-800/80 text-slate-400'}`}
                                style={{ width: '60px', height: '60px', borderRadius: '50%' }}
                            >
                                {isEraseMode ? 'ERASING' : 'ERASE'}
                            </button>
                            {chipValues.map(({ value, color }) => (
                                <Chip
                                    id={`sicbo-chip-${value}`}
                                    key={value}
                                    value={value}
                                    color={color}
                                    isSelected={selectedChip === value && !isEraseMode}
                                    onClick={() => { setSelectedChip(value); setIsEraseMode(false); playChipClick(); }}
                                />
                            ))}
                        </div>

                        {/* Info and Roll */}
                        <div className="roulette-info-spin-container flex-wrap justify-center">
                            <div className="roulette-total-bet-display min-w-[140px] flex flex-col items-center justify-center text-center">
                                <span className="roulette-total-bet-label">Total Bet</span>
                                <span className="roulette-total-bet-amount">${totalBet}</span>
                            </div>

                            <div className="roulette-action-buttons">
                                {phase === 'betting' && (
                                    <>
                                        <button
                                            onClick={handleClear}
                                            disabled={totalBet === 0}
                                            className="roulette-clear-btn tactile-button whitespace-nowrap"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleRoll}
                                            disabled={totalBet === 0}
                                            className="roulette-spin-btn tactile-button whitespace-nowrap w-auto"
                                        >
                                            ROLL
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Modal */}
                <ResultModal
                    isOpen={showResult}
                    type={winAmount > 0 ? 'win' : 'loss'}
                    title={winAmount > 0 ? 'You Won!' : 'No Luck'}
                    amount={winAmount > 0 ? `+$${winAmount}` : `-$${totalBet}`}
                    content={(
                        <div className="flex flex-col items-center">
                            <p className="text-lg opacity-80">Dice Result</p>
                            <div className="flex gap-2 mt-4">
                                {dice?.map((v, i) => (
                                    <div key={i} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border-b-4 border-slate-300">
                                        <div className="w-full h-full scale-75">
                                            {renderDiceDots(v, 'medium')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm mt-4 font-bold uppercase tracking-widest text-white/50">
                                Sum: <span className="text-white">{dice?.reduce((a, b) => a + b, 0)}</span>
                            </p>
                        </div>
                    )}
                    onPlayAgain={handleNewRound}
                />

                <HowToPlay gameName="Sic Bo" rules={SICBO_RULES} steps={SICBO_STEPS} tips={SICBO_TIPS} />
            </div>
        </div>
    );
};

export default SicBo;
