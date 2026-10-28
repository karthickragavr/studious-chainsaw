import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { getBackTarget } from '../utils/returnContext';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import HowToPlay from '../components/HowToPlay';
import ResultModal from '../components/ResultModal';
import ChipSelector from '../components/ChipSelector';
import Table from '../components/Table';
import canvasConfetti from 'canvas-confetti';
import { playChipClick, playCardSnap, playWinJingle, playLossStinger } from '../utils/sounds';

// Keno Rules and Config
const KENO_RULES = [
    "Select between 1 and 10 numbers (spots) from a grid of 1 to 80.",
    "The house will draw 20 random numbers.",
    "Your payout depends on how many numbers you picked and how many matched (hits).",
    "Different number of spots have different paytables.",
    "You can use Auto-Pick to select numbers randomly.",
    "Clear your selection to pick new numbers.",
    "Place your bet and hit Play to start the draw!"
];

const KENO_TIPS = [
    "Picking more numbers increases the potential max payout but decreases the odds of hitting all of them.",
    "Picking fewer numbers (like 3 or 4) has better odds of hitting a smaller payout.",
    "Keno is purely a game of chance based on random number generation."
];

// Simplified Keno Paytable (Returns multiplier based on spots picked and hits)
// Example: PAYTABLE[spots][hits] = multiplier
const PAYTABLE = {
    1: { 1: 3 },
    2: { 1: 1, 2: 9 },
    3: { 2: 2, 3: 47 },
    4: { 2: 1, 3: 5, 4: 91 },
    5: { 3: 3, 4: 12, 5: 820 },
    6: { 3: 1, 4: 4, 5: 70, 6: 1600 },
    7: { 3: 1, 4: 2, 5: 21, 6: 400, 7: 7000 },
    8: { 4: 2, 5: 12, 6: 100, 7: 1650, 8: 10000 },
    9: { 4: 1, 5: 6, 6: 44, 7: 335, 8: 4700, 9: 10000 },
    10: { 5: 5, 6: 24, 7: 142, 8: 1000, 9: 4500, 10: 10000 }
};

export default function Keno() {
    const { balance: wallet, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [drawnNumbers, setDrawnNumbers] = useState([]);
    const [bet, setBet] = useState(1);
    const [phase, setPhase] = useState('betting'); // betting, drawing, result
    const [showResult, setShowResult] = useState(false);
    const [payoutMultiplier, setPayoutMultiplier] = useState(0);
    const [payoutAmount, setPayoutAmount] = useState(0);

    const NUMBERS = useMemo(() => Array.from({ length: 80 }, (_, i) => i + 1), []);

    const toggleNumber = (num) => {
        if (phase !== 'betting') return;
        playChipClick();
        setSelectedNumbers(prev => {
            if (prev.includes(num)) return prev.filter(n => n !== num);
            if (prev.length >= 10) return prev; // Max 10 spots
            return [...prev, num];
        });
    };

    const clearSelection = () => {
        if (phase !== 'betting') return;
        playChipClick();
        setSelectedNumbers([]);
    };

    const autoPick = () => {
        if (phase !== 'betting') return;
        playChipClick();
        const count = 10;
        const shuffled = [...NUMBERS].sort(() => 0.5 - Math.random());
        setSelectedNumbers(shuffled.slice(0, count));
    };

    const evaluatePayout = (hits, spots, wager) => {
        if (spots === 0 || !PAYTABLE[spots] || !PAYTABLE[spots][hits]) return 0;
        return PAYTABLE[spots][hits] * wager;
    };

    const handlePlay = () => {
        if (selectedNumbers.length === 0 || bet > wallet || phase !== 'betting') return;

        playChipClick();
        updateBalance(-bet);
        addTransaction(-bet, 'Keno Bet');
        setPhase('drawing');
        setDrawnNumbers([]);
        setShowResult(false);

        // Draw 20 unique random numbers
        const shuffled = [...NUMBERS].sort(() => 0.5 - Math.random());
        const drawResult = shuffled.slice(0, 20);

        // Sequence draw animation
        let currentDraw = [];
        let index = 0;
        const drawInterval = setInterval(() => {
            if (index < 20) {
                currentDraw.push(drawResult[index]);
                setDrawnNumbers([...currentDraw]);
                playCardSnap(); // Tick sound
                index++;
            } else {
                clearInterval(drawInterval);
                finishRound(drawResult);
            }
        }, 150); // Speed of drawing
    };

    const finishRound = (finalDrawnNumbers) => {
        const hits = selectedNumbers.filter(n => finalDrawnNumbers.includes(n)).length;
        const spots = selectedNumbers.length;
        const winAmount = evaluatePayout(hits, spots, bet);

        setPayoutAmount(winAmount);
        setPayoutMultiplier(winAmount > 0 ? (winAmount / bet) : 0);

        logBet('Keno', bet, winAmount > 0 ? 'win' : 'loss', winAmount, { spots, hits });

        if (winAmount > 0) {
            updateBalance(winAmount);
            addTransaction('win', winAmount - bet, 'Keno');
            playWinJingle();
            if (winAmount >= bet * 10) {
                unlockAchievement('keno_big_win');
                canvasConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        } else {
            addTransaction('loss', -bet, 'Keno');
            playLossStinger();
        }

        setTimeout(() => {
            setPhase('result');
            setShowResult(true);
        }, 1000);
    };

    const resetGame = () => {
        setPhase('betting');
        setShowResult(false);
        setDrawnNumbers([]);
        // Keep selectedNumbers so they can easily play same numbers again
    };

    return (
        <Table theme="emerald">
            <header className="flex justify-between items-center mb-4 relative z-10 w-full max-w-4xl mx-auto">
                <Link to={getBackTarget('/keno').path} className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2 font-bold uppercase tracking-wider">
                    <ArrowLeft size={20} /> {getBackTarget('/keno').label}
                </Link>
                <div className="flex gap-4 items-center">
                    <span className="font-mono text-emerald-300 bg-black/40 px-4 py-2 rounded-lg border border-emerald-500/20">
                        Balance: ${wallet.toFixed(2)}
                    </span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/20">
                        <HelpCircle size={20} />
                    </motion.button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start relative z-10 w-full max-w-4xl mx-auto overflow-y-auto pb-24">
                {/* Game Title */}
                <div className="mb-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">KENO 80</h1>
                    <div className="flex gap-4 justify-center text-emerald-200/60 font-mono text-xs md:text-sm tracking-widest mt-1 uppercase">
                        <span>Spots: {selectedNumbers.length}/10</span>
                        <span>|</span>
                        <span>Hits: {drawnNumbers.filter(n => selectedNumbers.includes(n)).length}</span>
                    </div>
                </div>

                {/* Keno Grid */}
                <div className="w-full max-w-2xl bg-black/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 md:p-6 mb-6 shadow-2xl">
                    <div className="grid grid-cols-10 gap-1 md:gap-2">
                        {NUMBERS.map(num => {
                            const isSelected = selectedNumbers.includes(num);
                            const isDrawn = drawnNumbers.includes(num);
                            const isHit = isSelected && isDrawn;

                            let displayClass = "bg-slate-800 text-slate-400 hover:bg-slate-700 border-transparent";
                            if (isHit) {
                                displayClass = "bg-yellow-500 text-black font-black border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,1)]";
                            } else if (isSelected) {
                                displayClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
                            } else if (isDrawn) {
                                displayClass = "bg-red-500 text-white font-bold border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
                            }

                            return (
                                <motion.button
                                    key={num}
                                    whileHover={phase === 'betting' ? { scale: 1.1, zIndex: 10 } : {}}
                                    whileTap={phase === 'betting' ? { scale: 0.95 } : {}}
                                    onClick={() => toggleNumber(num)}
                                    disabled={phase !== 'betting'}
                                    className={`relative aspect-square rounded-md border-2 text-xs md:text-sm md:font-semibold transition-colors flex items-center justify-center ${displayClass}`}
                                >
                                    {num}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Controls & Betting Panel */}
                <div className="w-full max-w-2xl bg-black/40 p-4 md:p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col md:flex-row items-center gap-6">
                    {/* Action Buttons */}
                    <div className="flex w-full md:w-auto md:flex-col gap-2 flex-grow">
                        <button
                            onClick={autoPick}
                            disabled={phase !== 'betting'}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-xl border border-slate-600 disabled:opacity-50 text-sm font-bold tracking-wider"
                        >
                            AUTO PICK
                        </button>
                        <button
                            onClick={clearSelection}
                            disabled={phase !== 'betting' || selectedNumbers.length === 0}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-xl border border-slate-600 disabled:opacity-50 text-sm font-bold tracking-wider"
                        >
                            CLEAR
                        </button>
                    </div>

                    {/* Betting Chips */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Bet Amount</span>
                        <div className="scale-90 md:scale-100">
                            <ChipSelector
                                preset="mid"
                                selectedChip={bet}
                                onSelectChip={(val) => phase === 'betting' && setBet(val)}
                                idPrefix="keno"
                            />
                        </div>
                    </div>

                    {/* Play Button */}
                    <div className="w-full md:w-auto">
                        <button
                            onClick={handlePlay}
                            disabled={phase !== 'betting' || selectedNumbers.length === 0 || bet > wallet}
                            className={`tactile-button tactile-button-emerald w-full md:w-32 h-16 text-lg tracking-widest ${(phase !== 'betting' || selectedNumbers.length === 0 || bet > wallet) ? 'opacity-50 grayscale cursor-not-allowed' : ''
                                }`}
                        >
                            PLAY
                        </button>
                    </div>
                </div>

            </main>

            <ResultModal
                isOpen={showResult}
                type={payoutAmount > 0 ? 'win' : 'loss'}
                title={payoutAmount > 0 ? 'KENO WINNER!' : 'NO WIN'}
                amount={payoutAmount > 0 ? `+$${payoutAmount}` : `-$${bet}`}
                onClose={resetGame}
                content={
                    <div className="flex flex-col items-center mt-2">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-center">
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-white/50">Spots Picked</span>
                                <span className="text-xl font-mono text-white">{selectedNumbers.length}</span>
                            </div>
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-white/50">Matches (Hits)</span>
                                <span className="text-xl font-mono text-amber-400 font-bold">{selectedNumbers.filter(n => drawnNumbers.includes(n)).length}</span>
                            </div>
                        </div>
                        {payoutMultiplier > 0 && (
                            <div className="mt-4 px-4 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full">
                                <span className="text-amber-400 font-bold text-sm">{payoutMultiplier}x Payout</span>
                            </div>
                        )}
                    </div>
                }
            />
        </Table>
    );
}
