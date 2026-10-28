import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoulette, getNumberColor } from '../hooks/useRoulette';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import HowToPlay from '../components/HowToPlay';
import Chip from '../components/Chip';
import { playChipClick, playWinJingle, playRouletteClick, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';
import ResultModal from '../components/ResultModal';


const ROULETTE_RULES = [
    "European roulette uses numbers 0–36 on a spinning wheel.",
    "BETS: Single (35:1), Split (17:1), Street (11:1), Corner (8:1).",
    "OUTSIDE: Red/Black (1:1), Odd/Even (1:1), Dozens (2:1), Column (2:1).",
    "Green zero (0) means all outside bets (colors, dozens, etc.) lose.",
];

const ROULETTE_STEPS = [
    "Select a chip value to set your bet amount.",
    "Tap numbers for direct bets, or lines/intersections for Split/Corner bets.",
    "Use '11:1' for Street bets and '2:1' for Column bets.",
    "Toggle 'ERASE' to selectively remove chips from the board.",
    "Click 'Spin' and watch the ball land to calculate winnings.",
];

const ROULETTE_TIPS = [
    "Spread your risk by placing 'Split' or 'Corner' bets on intersections.",
    "Column and Dozens bets cover 12 numbers and pay 2:1.",
    "Outside bets provide the highest win probability (~48.6%).",
];

const NUMBERS_GRID = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function Roulette() {
    const {
        phase, result, spinAngle, bets,
        placeBet, removeBet, clearBets, getTotalBet,
        spin, calculateWinnings, resetGame
    } = useRoulette();

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

    const handleSpin = () => {
        if (getTotalBet() === 0) return;
        const interval = setInterval(() => {
            playRouletteClick();
        }, 150);
        setTimeout(() => clearInterval(interval), 3800);
        spin();
    };

    const totalBet = getTotalBet();

    useEffect(() => {
        if (phase === 'result' && result !== null) {
            const timer = setTimeout(() => {
                const winnings = calculateWinnings();
                setWinAmount(winnings);
                if (winnings > 0) {
                    updateBalance(winnings);
                    addTransaction('win', winnings - totalBet, 'Roulette');
                    logBet('Roulette', totalBet, 'win', winnings, { number: result });
                    unlockAchievement('first_win');
                    playWinJingle();
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } else {
                    addTransaction('loss', -totalBet, 'Roulette');
                    logBet('Roulette', totalBet, 'loss', 0, { number: result });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [phase, result]);

    const handleNewRound = () => {
        setShowResult(false);
        setWinAmount(0);
        resetGame();
    };

    const getNumBg = (n) => {
        const color = getNumberColor(n);
        if (color === 'red') return 'bg-red-700 hover:bg-red-600';
        if (color === 'black') return 'bg-zinc-900 hover:bg-zinc-800';
        return 'bg-emerald-700 hover:bg-emerald-600';
    };

    const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

    const generateConicGradient = () => {
        const step = 360 / 37;
        let grad = `from 0deg, `;
        wheelNumbers.forEach((n, i) => {
            const start = i * step;
            const end = (i + 1) * step;
            const color = n === 0 ? '#10b981' : getNumberColor(n) === 'red' ? '#ef4444' : '#111827';
            grad += `${color} ${start}deg ${end}deg${i === wheelNumbers.length - 1 ? '' : ', '}`;
        });
        return grad;
    };

    return (
        <div className="roulette-container">
            <div className="roulette-main-area">

                {/* Information Header */}
                <div className="w-full flex justify-between items-center mb-1 md:mb-6 max-w-2xl px-3 box-border mx-auto">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 uppercase tracking-wider leading-tight">European Roulette</h1>
                    </div>

                </div>

                {/* Polished Wheel */}
                <div className="roulette-wheel-container">
                    <HowToPlay gameName="Roulette" rules={ROULETTE_RULES} steps={ROULETTE_STEPS} tips={ROULETTE_TIPS} />
                    <div className="absolute inset-0 rounded-[40px] bg-gradient-to-tr from-amber-600/5 to-amber-900/20 blur-3xl pointer-events-none"></div>

                    <div className="roulette-wheel-section">
                        <div className="absolute inset-[-12px] md:inset-[-20px] rounded-full border-[10px] border-slate-800 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.1)] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900" />

                        <motion.div
                            className="relative w-full h-full rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.8)] border-4 border-slate-950 overflow-hidden"
                            style={{ background: `conic-gradient(${generateConicGradient()})` }}
                            animate={{ rotate: phase === 'spinning' ? spinAngle : 0 }}
                            transition={{
                                duration: 4,
                                ease: [0.2, 0.8, 0.3, 1]
                            }}
                        >
                            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 100 100">
                                {Array.from({ length: 37 }).map((_, i) => (
                                    <line
                                        key={i}
                                        x1="50" y1="50"
                                        x2={50 + 50 * Math.cos((i * 360 / 37 - 90) * Math.PI / 180)}
                                        y2={50 + 50 * Math.sin((i * 360 / 37 - 90) * Math.PI / 180)}
                                        stroke="white" strokeWidth="0.2"
                                    />
                                ))}
                            </svg>

                            {wheelNumbers.map((n, i) => {
                                const angle = i * (360 / 37) + (360 / 37 / 2);
                                return (
                                    <div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 w-8 h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none flex justify-center"
                                        style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
                                    >
                                        <span className="pt-1 md:pt-2 text-[8px] md:text-[11px] font-bold text-white/90 select-none">
                                            {n}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-transparent to-black/40 pointer-events-none" />
                        </motion.div>

                        <div className="absolute w-12 h-12 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-slate-200 via-gray-400 to-slate-600 z-20 flex flex-col items-center justify-center border-4 border-slate-900 shadow-[inset_0_2px_8px_rgba(255,255,255,0.8),0_10px_20px_rgba(0,0,0,0.6)] text-center">
                            {result !== null && phase === 'result' ? (
                                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <span className={`text-2xl md:text-5xl font-black ${getNumberColor(result) === 'red' ? 'text-red-600' : getNumberColor(result) === 'black' ? 'text-slate-900' : 'text-emerald-600'}`}>
                                        {result}
                                    </span>
                                </motion.div>
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                            )}
                        </div>

                        {/* Top Pointer */}
                        <div className="absolute top-[-10px] md:top-[-20px] left-1/2 -translate-x-1/2 z-30">
                            <div className="w-5 h-8 md:w-8 md:h-12 bg-gradient-to-b from-amber-400 to-amber-600 rounded-b-full shadow-lg" />
                        </div>
                    </div>
                </div>

                <div className="w-full pb-2 md:pb-4 px-1 box-border">
                    <div className="roulette-betting-grid p-0.5 md:p-8 flex flex-col gap-2 md:gap-4 mx-auto max-w-5xl bg-black/40 rounded-[30px] md:rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden relative">

                        {/* Unified Mobile Scale Wrapper */}
                        <div className="flex flex-col gap-1 md:gap-1.5 origin-top scale-[0.82] sm:scale-95 md:scale-100 transition-transform">

                            {/* Unified 14-Column Mega Grid Betting Board */}
                            <div className="roulette-board-container">
                                <div className="roulette-mega-grid">

                                    {/* Zero - Col 1, Spans 3 Rows */}


                                    {/* Zero Button - Spans first 3 rows of Col 1 */}
                                    <button
                                        onClick={() => handlePlaceBet('number-0')}
                                        disabled={phase !== 'betting'}
                                        style={{ gridRow: '1 / span 3', gridColumn: 1 }}
                                        className={`rounded-l-lg border-2 transition-all flex flex-col items-center justify-center relative ${getNumBg(0)} ${bets['number-0'] ? 'scale-95 shadow-inner border-amber-400 z-10' : 'hover:scale-[1.01] hover:z-10'}`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-white text-lg md:text-2xl font-black drop-shadow-md">0</span>
                                            {bets['number-0'] > 0 && (
                                                <div className={`mt-2 text-[8px] md:text-[11px] px-2 py-0.5 rounded-full border border-white/20 font-bold shadow-lg ${isEraseMode ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-400 text-black'}`}>
                                                    ${bets['number-0']}
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Numbers and Column (2:1) Bets - Explicitly Placed */}
                                    {NUMBERS_GRID.map((row, ri) => (
                                        <React.Fragment key={`row-group-${ri}`}>
                                            {row.map((num, ci) => {
                                                const numKey = `number-${num}`;
                                                return (
                                                    <button
                                                        key={`num-${num}`}
                                                        onClick={() => handlePlaceBet(numKey)}
                                                        disabled={phase !== 'betting'}
                                                        style={{ gridRow: ri + 1, gridColumn: ci + 2 }}
                                                        className={`roulette-number-btn ${getNumberColor(num) === 'red' ? 'bg-red-600 border-red-500/30' : 'bg-zinc-900 border-zinc-700/30'} ${bets[numKey] ? 'scale-95 shadow-inner border-amber-400 z-10' : 'hover:scale-[1.02] hover:z-10'}`}
                                                    >
                                                        <span className="text-white drop-shadow-sm">{num}</span>
                                                        {bets[numKey] > 0 && (
                                                            <div className={`absolute -top-1 -right-1 z-20 text-[7px] md:text-[10px] px-1.5 py-0.5 rounded-full border border-white/20 font-bold shadow-md ${isEraseMode ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-400 text-black'}`}>
                                                                ${bets[numKey]}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {/* Column Bet Button at the end of each row (Col 14) */}
                                            <button
                                                onClick={() => handlePlaceBet(`col-${ri + 1}`)}
                                                disabled={phase !== 'betting'}
                                                style={{ gridRow: ri + 1, gridColumn: 14 }}
                                                className={`roulette-column-btn ${bets[`col-${ri + 1}`] ? 'bg-amber-400/20 border-amber-400 text-amber-400' : 'bg-zinc-900/60 border-zinc-500/20 text-zinc-300'}`}
                                            >
                                                <span className={bets[`col-${ri + 1}`] > 0 ? 'hidden' : 'block'}>2:1</span>
                                                {bets[`col-${ri + 1}`] > 0 && (
                                                    <span className={`text-[7px] md:text-[9px] px-1 rounded-full ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black shadow-sm'}`}>
                                                        ${bets[`col-${ri + 1}`]}
                                                    </span>
                                                )}
                                            </button>
                                        </React.Fragment>
                                    ))}

                                    {/* Advanced Betting Hit Zones - Spans Rows 1-3, Cols 2-13 */}
                                    <div
                                        style={{ gridRow: '1/4', gridColumn: '2/14' }}
                                        className="pointer-events-none relative z-10"
                                    >
                                        <div className="absolute inset-0">
                                            {/* Vertical Splits (intersections between numbers horizontally) */}
                                            {Array.from({ length: 11 }).map((_, ci) => (
                                                Array.from({ length: 3 }).map((_, ri) => {
                                                    const n1 = NUMBERS_GRID[ri][ci];
                                                    const n2 = NUMBERS_GRID[ri][ci + 1];
                                                    const splitKey = `split-${n1}-${n2}`;
                                                    return (
                                                        <div
                                                            key={splitKey}
                                                            onClick={(e) => { e.stopPropagation(); handlePlaceBet(splitKey); }}
                                                            className={`absolute w-6 md:w-8 h-full pointer-events-auto transform -translate-x-1/2 flex items-center justify-center transition-colors hover:bg-white/5 cursor-pointer`}
                                                            style={{ left: `${((ci + 1) / 12) * 100}%`, height: '33.33%', top: `${ri * 33.33}%` }}
                                                        >
                                                            {bets[splitKey] > 0 && (
                                                                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-bold shadow-lg border border-white/20 ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black'}`}>
                                                                    ${bets[splitKey]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ))}

                                            {/* Horizontal Splits & Corners */}
                                            {Array.from({ length: 12 }).map((_, ci) => (
                                                Array.from({ length: 2 }).map((_, ri) => {
                                                    const n1 = NUMBERS_GRID[ri][ci];
                                                    const n2 = NUMBERS_GRID[ri + 1][ci];
                                                    const splitKey = `split-${n1}-${n2}`;
                                                    const isLastCol = ci === 11;
                                                    const cornerKey = !isLastCol ? `corner-${n1}-${NUMBERS_GRID[ri][ci + 1]}-${n2}-${NUMBERS_GRID[ri + 1][ci + 1]}` : null;

                                                    return (
                                                        <React.Fragment key={`h-zone-${ci}-${ri}`}>
                                                            {/* Horizontal Split Zone */}
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handlePlaceBet(splitKey); }}
                                                                className={`absolute h-6 md:h-8 pointer-events-auto transform -translate-y-1/2 flex items-center justify-center transition-colors hover:bg-white/5 cursor-pointer`}
                                                                style={{ top: `${((ri + 1) * 33.33)}%`, left: `${(ci / 12) * 100}%`, width: `${1 / 12 * 100}%` }}
                                                            >
                                                                {bets[splitKey] > 0 && (
                                                                    <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-bold shadow-lg border border-white/20 ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black'}`}>
                                                                        ${bets[splitKey]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Corner Zone (Intersection of 4) */}
                                                            {cornerKey && (
                                                                <div
                                                                    onClick={(e) => { e.stopPropagation(); handlePlaceBet(cornerKey); }}
                                                                    className={`absolute w-8 h-8 md:w-10 md:h-10 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center hover:bg-white/10 rounded-full cursor-pointer`}
                                                                    style={{ left: `${((ci + 1) / 12) * 100}%`, top: `${((ri + 1) * 33.33)}%` }}
                                                                >
                                                                    {bets[cornerKey] > 0 && (
                                                                        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-bold shadow-xl border border-white/10 ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black'}`}>
                                                                            ${bets[cornerKey]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            ))}

                                            {/* Zero Splits - The line between 0 and 1,2,3 */}
                                            <div className="absolute top-0 bottom-0 left-0 w-8 md:w-12 pointer-events-auto transform -translate-x-1/2 z-20">
                                                {[3, 2, 1].map((n, i) => {
                                                    const betKey = `split-0-${n}`;
                                                    return (
                                                        <div
                                                            key={betKey}
                                                            onClick={(e) => { e.stopPropagation(); handlePlaceBet(betKey); }}
                                                            className={`absolute h-1/3 left-0 right-0 flex items-center justify-center hover:bg-white/5 cursor-pointer`}
                                                            style={{ top: `${i * 33.33}%` }}
                                                        >
                                                            {bets[betKey] > 0 && (
                                                                <div className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[6px] md:text-[8px] font-bold shadow-md border border-white/20 ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black'}`}>
                                                                    ${bets[betKey]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Streets Row - Row 4, Cols 2-13 */}
                                    {Array.from({ length: 12 }).map((_, ci) => {
                                        const startNum = NUMBERS_GRID[2][ci];
                                        const streetKey = `street-${startNum}`;
                                        return (
                                            <button
                                                key={streetKey}
                                                onClick={() => handlePlaceBet(streetKey)}
                                                disabled={phase !== 'betting'}
                                                style={{ gridRow: 4, gridColumn: ci + 2 }}
                                                className={`h-5 md:h-7 rounded-b-md border-x-2 border-b-2 transition-all flex flex-col items-center justify-center text-[7px] md:text-[9px] font-black -mt-0.5 ${bets[streetKey] ? 'bg-amber-400/20 border-amber-400 text-amber-400' : 'bg-zinc-900/60 border-zinc-500/20 text-zinc-300'}`}
                                            >
                                                <span className={bets[streetKey] > 0 ? 'hidden' : 'block'}>11:1</span>
                                                {bets[streetKey] > 0 && (
                                                    <span className={`text-[7px] md:text-[9px] px-1 rounded-full ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black shadow-sm'}`}>
                                                        ${bets[streetKey]}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}

                                    {/* Dozens - Row 5, Spans Full Width */}
                                    {['1st12', '2nd12', '3rd12'].map((d, i) => (
                                        <button
                                            key={d}
                                            onClick={() => handlePlaceBet(d)}
                                            disabled={phase !== 'betting'}
                                            style={{
                                                gridRow: 5,
                                                gridColumn: i === 0 ? '1 / span 5' : i === 1 ? '6 / span 4' : '10 / span 5'
                                            }}
                                            className={`h-11 md:h-14 rounded-md md:rounded-xl border-2 transition-all flex flex-col items-center justify-center text-[10px] md:text-sm font-black uppercase mt-1 ${bets[d] ? 'bg-amber-400/10 border-amber-400 text-amber-400' : 'bg-zinc-900/60 border-zinc-500/20 text-zinc-300'}`}
                                        >
                                            <span>{d === '1st12' ? '1st 12' : d === '2nd12' ? '2nd 12' : '3rd 12'}</span>
                                            {bets[d] > 0 && (
                                                <span className={`text-[7px] md:text-[9px] mt-0.5 px-1 rounded-full ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black shadow-md'}`}>
                                                    ${bets[d]}
                                                </span>
                                            )}
                                        </button>
                                    ))}

                                    {/* Outside Bets - Row 6, Spans Full Width */}
                                    {[
                                        { key: 'low', label: '1–18', col: '1 / span 3' },
                                        { key: 'even', label: 'Even', col: '4 / span 2' },
                                        { key: 'red', label: 'Red', bgClass: 'bg-red-700', col: '6 / span 2' },
                                        { key: 'black', label: 'Black', bgClass: 'bg-zinc-900', col: '8 / span 2' },
                                        { key: 'odd', label: 'Odd', col: '10 / span 2' },
                                        { key: 'high', label: '19–36', col: '12 / span 3' }
                                    ].map(({ key, label, bgClass, col }) => (
                                        <button
                                            key={key}
                                            onClick={() => handlePlaceBet(key)}
                                            disabled={phase !== 'betting'}
                                            style={{ gridRow: 6, gridColumn: col }}
                                            className={`h-11 md:h-14 rounded-md md:rounded-xl border-2 transition-all flex flex-col items-center justify-center text-[10px] md:text-sm font-black uppercase mt-1 ${bets[key] ? 'border-amber-400 text-amber-400' : bgClass ? `${bgClass} border-zinc-500/30 text-white` : 'bg-zinc-900/60 border-zinc-500/20 text-zinc-300'}`}
                                        >
                                            <span>{label}</span>
                                            {bets[key] > 0 && (
                                                <span className={`text-[7px] md:text-[9px] mt-0.5 px-1 rounded-full ${isEraseMode ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black shadow-md'}`}>
                                                    ${bets[key]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Controls Panel */}
                            <div className="flex flex-col gap-1 md:gap-4 mt-1 md:mt-6 border-t border-white/10 pt-1 md:pt-6">
                                <div className="flex flex-wrap justify-center items-center gap-1.5 md:gap-6">
                                    <button
                                        onClick={() => setIsEraseMode(!isEraseMode)}
                                        className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-[10px] md:text-xs font-black transition-all ${isEraseMode ? 'bg-red-600 border-white text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-110' : 'bg-zinc-800 border-zinc-500/40 text-zinc-300 hover:text-red-400 hover:border-red-400/50'}`}
                                    >
                                        {isEraseMode ? 'ERASING' : 'ERASE'}
                                    </button>
                                    {chipValues.map(({ value, color }) => (
                                        <Chip
                                            id={`roulette-chip-${value}`}
                                            key={value}
                                            value={value}
                                            color={color}
                                            isSelected={selectedChip === value && !isEraseMode}
                                            onClick={() => { setSelectedChip(value); setIsEraseMode(false); playChipClick(); }}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-12">
                                    <div className="roulette-total-bet-display">
                                        <span className="roulette-total-bet-label">Total Bet</span>
                                        <span className="roulette-total-bet-amount">${totalBet}</span>
                                    </div>
                                    <div className="roulette-action-buttons">
                                        {phase === 'result' ? (
                                            <button onClick={handleNewRound} className="roulette-new-round-btn">New Round</button>
                                        ) : (
                                            <>
                                                <button onClick={handleClear} disabled={totalBet === 0} className="roulette-clear-btn">Clear</button>
                                                <button onClick={handleSpin} disabled={totalBet === 0 || phase === 'spinning'} className="roulette-spin-btn">SPIN</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                {/* Result Modal */}
                <ResultModal
                    isOpen={showResult}
                    type={winAmount > 0 ? 'win' : 'loss'}
                    title={winAmount > 0 ? 'Winner!' : 'No Luck'}
                    amount={winAmount > 0 ? `+$${winAmount}` : `-$${totalBet}`}
                    content={(
                        <div className="flex flex-col items-center">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/20 mb-4 ${result === 0 ? 'bg-emerald-600' : getNumberColor(result) === 'red' ? 'bg-red-600' : 'bg-zinc-800'}`}>
                                {result}
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-white/50">
                                {result === 0 ? 'Zero' : `${getNumberColor(result)} - ${result % 2 === 0 ? 'Even' : 'Odd'}`}
                            </p>
                        </div>
                    )}
                    onPlayAgain={handleNewRound}
                />


            </div>
        </div>
    );
}

export default Roulette;
