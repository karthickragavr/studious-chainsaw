import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoker, PAY_TABLE } from '../hooks/usePoker';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import HowToPlay from '../components/HowToPlay';
import { playChipClick, playWinJingle, playCardSnap, playShuffle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';
import ResultModal from '../components/ResultModal';


const POKER_RULES = [
    "This is Video Poker — Jacks or Better.",
    "You are dealt 5 cards. Choose which to hold and discard the rest.",
    "New cards replace discarded ones. Your final hand determines the payout.",
    "Minimum winning hand is a pair of Jacks or higher.",
    "Royal Flush pays 800x your bet!",
];

const POKER_STEPS = [
    "Place your bet using the chips.",
    "Click 'Deal' to receive 5 cards.",
    "Click cards to hold them (held cards are kept).",
    "Click 'Draw' to replace un-held cards.",
    "Your final hand is evaluated against the pay table.",
];

const POKER_TIPS = [
    "Always hold a winning pair or better.",
    "Keep 4 cards to a flush or straight and discard the 5th.",
    "Never break a winning hand chasing a Royal Flush.",
];

function Poker() {
    const { hand, held, phase, result, dealHand, toggleHold, drawCards, resetGame } = usePoker();
    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();
    const [bet, setBet] = useState(10);
    const [showResult, setShowResult] = useState(false);

    const handleDeal = () => {
        if (bet > balance) return;
        updateBalance(-bet);
        playShuffle();
        dealHand();
    };

    useEffect(() => {
        if (phase === 'result' && result) {
            const timer = setTimeout(() => {
                if (result.multiplier > 0) {
                    const won = bet * result.multiplier;
                    updateBalance(won);
                    addTransaction('win', won - bet, 'Poker');
                    logBet('Poker', bet, 'win', won, { hand: result.name });
                    unlockAchievement('first_win');
                    if (result.name === 'Royal Flush') unlockAchievement('poker_royal_flush');
                    playWinJingle();
                    if (result.multiplier >= 25) {
                        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
                    } else {
                        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                    }
                } else {
                    addTransaction('loss', -bet, 'Poker');
                    logBet('Poker', bet, 'loss', 0, { hand: result.name });
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
        resetGame();
    };

    return (
        <div className="video-poker-container pt-4 md:pt-20">
            {/* Physical Cabinet Frame */}
            <div className="machine-frame max-w-4xl mx-auto">
                <div className="video-poker-panel p-2 sm:p-8">
                    {/* Header Panel */}
                    <div className="video-poker-title-container mb-4 sm:mb-6 text-center">
                        <h2 className="video-poker-title text-xl sm:text-3xl font-black italic tracking-tighter text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            VIDEO POKER
                        </h2>
                        <p className="video-poker-subtitle text-[8px] sm:text-xs font-bold uppercase tracking-[0.5em] opacity-50 mt-1">Jacks or Better</p>
                    </div>

                    {/* High-Definition Machine Screen */}
                    <div className="machine-screen mb-8 shadow-inner border-y border-white/5 overflow-hidden">
                        <div className="machine-screen-reflection" />

                        {/* Integrated Pay Table (Horizontal LED Style) */}
                        <div className="video-poker-pay-table p-1 md:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-0.5 md:gap-1 bg-black/40 border-b border-white/5 relative z-10">
                            {PAY_TABLE.sort((a, b) => b.multiplier - a.multiplier).map(({ name, multiplier }) => (
                                <div
                                    key={name}
                                    className={`video-poker-pay-row flex flex-col items-center justify-center p-0.5 md:p-2 rounded border transition-all duration-300 ${result?.name === name ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-black/20 border-white/5 opacity-60'}`}
                                >
                                    <span className="text-[6px] md:text-[8px] font-black uppercase tracking-tighter text-center leading-tight mb-0.5 h-auto md:h-4 flex items-center text-amber-200/90">{name}</span>
                                    <span className="text-[9px] md:text-xs font-mono font-black text-amber-400">{multiplier}x</span>
                                </div>
                            ))}
                        </div>

                        {/* Cards Display Area */}
                        <div className="video-poker-cards-container pt-10 pb-2 px-1 md:p-10 flex justify-center gap-0.5 sm:gap-2 relative z-10">
                            {hand.map((card, i) => (
                                <div key={card.id || i} className="video-poker-card-wrapper relative flex-shrink-0 origin-center">
                                    <motion.div
                                        whileHover={phase === 'deal' ? { scale: 1.05 } : {}}
                                        onClick={() => { toggleHold(i); playChipClick(); }}
                                        className={`video-poker-card-motion transition-all duration-300 ${held[i] ? '-translate-y-6 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]' : ''}`}
                                    >
                                        <div className="video-poker-card-inner relative p-0 bg-white/5 rounded-lg">
                                            <div className="scale-[0.85] min-[430px]:scale-[0.9] sm:scale-100 origin-center">
                                                <Card suit={card.suit} value={card.value} isFaceUp={true} />
                                            </div>
                                            {held[i] && (
                                                <div className="absolute inset-0 bg-amber-500/10 rounded-lg pointer-events-none border border-amber-400/50" />
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Held Indicator LED */}
                                    <div className="video-poker-card-status-container mt-4 flex justify-center h-6">
                                        <AnimatePresence>
                                            {held[i] && (
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="video-poker-card-status bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                                >
                                                    HELD
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {!held[i] && phase === 'deal' && (
                                            <span className="text-[10px] font-black text-amber-400 animate-pulse">TAP</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Physical Control Panel */}
                    <div className="video-poker-controls-container p-4 sm:p-6 bg-black/30 rounded-[2rem] border border-white/5 shadow-2xl">
                        {phase === 'betting' ? (
                            <div className="flex flex-col gap-6">
                                {/* Row 1: Chips */}
                                <div className="w-full flex justify-center py-1">
                                    <div className="scale-90 sm:scale-100">
                                        <ChipSelector
                                            preset="medium"
                                            selectedChip={bet}
                                            onSelectChip={setBet}
                                            idPrefix="poker"
                                            chipScale={1.1}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Controls */}
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 pt-4 border-t border-white/5">
                                    <div className="text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 mb-1">Bet Amount</span>
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">${bet}</span>
                                    </div>
                                    <button
                                        id="poker-deal-btn"
                                        onClick={handleDeal}
                                        disabled={bet > balance}
                                        className="video-poker-deal-btn tactile-button tactile-button-gold w-full md:w-auto px-12 py-3 sm:py-6 text-lg sm:text-2xl min-w-0 md:min-w-[240px]"
                                    >
                                        DEAL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                                <div className="text-center px-8 md:border-r border-white/10">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Current Bet</span>
                                    <span className="text-xl md:text-2xl font-black font-mono text-white">${bet}</span>
                                </div>

                                <button
                                    id="poker-draw-btn"
                                    onClick={drawCards}
                                    disabled={phase !== 'deal'}
                                    className={`video-poker-draw-btn tactile-button ${phase === 'deal' ? 'tactile-button-gold animate-pulse' : 'opacity-50'} w-full md:w-auto px-12 md:px-16 py-3 sm:py-5 text-lg md:text-xl min-w-0 md:min-w-[200px]`}
                                >
                                    {phase === 'result' ? 'EVALUATING...' : 'DRAW'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                type={result?.multiplier > 0 ? 'win' : 'loss'}
                title={result?.multiplier > 0 ? result.name : 'House Wins'}
                amount={result?.multiplier > 0 ? `+$${bet * result.multiplier}` : `-$${bet}`}
                content={(
                    <div className="flex flex-col items-center">
                        <p className="text-lg opacity-80">{result?.name}</p>
                        <div className="flex justify-center gap-1 mt-3 scale-50 -mb-6">
                            {hand.map((card, i) => (
                                <Card key={i} suit={card.suit} value={card.value} isFaceUp={true} />
                            ))}
                        </div>
                    </div>
                )}
                onPlayAgain={handleNewRound}
                playAgainLabel="New Round"
            />

            <HowToPlay gameName="Video Poker" rules={POKER_RULES} steps={POKER_STEPS} tips={POKER_TIPS} />
        </div>
    );
}

export default Poker;
