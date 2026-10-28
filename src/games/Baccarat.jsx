import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultModal from '../components/ResultModal';

import { useBaccarat } from '../hooks/useBaccarat';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import Table from '../components/Table';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import HowToPlay from '../components/HowToPlay';
import { playWinJingle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';

const BACCARAT_RULES = [
    "Two hands are dealt: Player and Banker.",
    "Card values: A=1, 2–9=face value, 10/J/Q/K=0.",
    "Hand value is the last digit of the total (e.g., 15 → 5).",
    "Natural 8 or 9 wins immediately.",
    "Third card is drawn automatically based on the tableau.",
    "Closest to 9 wins. Banker bet pays 0.95:1 (5% commission).",
];

const BACCARAT_STEPS = [
    "Choose your bet: Player (1:1), Banker (0.95:1), or Tie (8:1).",
    "Select your bet amount using the chips.",
    "Click 'Deal' to start the round.",
    "Cards are dealt and third cards drawn automatically.",
    "The hand closest to 9 wins!",
];

const BACCARAT_TIPS = [
    "Banker bet has the lowest house edge (~1.06%).",
    "Avoid the Tie bet — it has a 14.4% house edge.",
    "Baccarat is pure chance — there is no strategy to influence the outcome.",
];

function Baccarat() {
    const {
        playerHand, bankerHand, playerTotal, bankerTotal,
        phase, result, deal, resetGame
    } = useBaccarat();

    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();
    const [bet, setBet] = useState(100);
    const [betSide, setBetSide] = useState(null); // player, banker, tie
    const [showResult, setShowResult] = useState(false);

    const handleDeal = () => {
        if (!betSide || bet > balance) return;
        updateBalance(-bet);
        deal();
    };

    useEffect(() => {
        if (phase === 'result' && result) {
            const timer = setTimeout(() => {
                let winnings = 0;
                if (result === betSide) {
                    if (betSide === 'player') winnings = bet * 2;
                    else if (betSide === 'banker') winnings = Math.floor(bet * 1.95);
                    else if (betSide === 'tie') winnings = bet * 9;
                    playWinJingle();
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
                if (winnings > 0) {
                    updateBalance(winnings);
                    addTransaction('win', winnings - bet, 'Baccarat');
                    logBet('Baccarat', bet, 'win', winnings, { betSide, result });
                    unlockAchievement('first_win');
                } else {
                    addTransaction('loss', -bet, 'Baccarat');
                    logBet('Baccarat', bet, 'loss', 0, { betSide, result });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [phase, result]);

    const handleNewRound = () => {
        setShowResult(false);
        setBetSide(null);
        resetGame();
    };

    const won = result === betSide;
    const getWinText = () => {
        if (!won) return `Lost $${bet}`;
        if (betSide === 'tie') return `Won $${bet * 8}`;
        if (betSide === 'banker') return `Won $${Math.floor(bet * 0.95)}`;
        return `Won $${bet}`;
    };

    return (
        <div className="baccarat-container table-surface-spotlight table-felt-blue">
            <Table>
                <main className="baccarat-main-area">
                    {/* Card Areas */}
                    <div className="baccarat-hands-area">
                        {/* Player Hand */}
                        <div className={`baccarat-hand-box ${result === 'player' ? 'winner' : ''}`}>
                            <span className="baccarat-label">Player</span>
                            <div className="baccarat-cards-row">
                                {playerHand.map((card, i) => (
                                    <div key={card.id} className="baccarat-card-motion">
                                        <Card suit={card.suit} value={card.value} isFaceUp={phase === 'result'} />
                                    </div>
                                ))}
                            </div>
                            {playerHand.length > 0 && phase === 'result' && (
                                <span className="baccarat-score">{playerTotal}</span>
                            )}
                        </div>

                        {/* Banker Hand */}
                        <div className={`baccarat-hand-box ${result === 'banker' ? 'winner' : ''}`}>
                            <span className="baccarat-label">Banker</span>
                            <div className="baccarat-cards-row">
                                {bankerHand.map((card, i) => (
                                    <div key={card.id} className="baccarat-card-motion">
                                        <Card suit={card.suit} value={card.value} isFaceUp={phase === 'result'} />
                                    </div>
                                ))}
                            </div>
                            {bankerHand.length > 0 && phase === 'result' && (
                                <span className="baccarat-score">{bankerTotal}</span>
                            )}
                        </div>
                    </div>

                    {/* Dealing Phase Indicator */}
                    {phase === 'dealing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center mt-4"
                        >
                            <p className="text-amber-400 text-lg font-bold uppercase tracking-widest animate-pulse">
                                Dealing...
                            </p>
                        </motion.div>
                    )}

                    {/* Betting Phase */}
                    {phase === 'betting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="baccarat-betting-area"
                        >
                            {/* Bet Side Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    { key: 'player', label: 'Player', sub: '1:1', type: 'player' },
                                    { key: 'tie', label: 'Tie', sub: '8:1', type: 'tie' },
                                    { key: 'banker', label: 'Banker', sub: '0.95:1', type: 'banker' },
                                ].map(({ key, label, sub, type }) => (
                                    <button
                                        id={`baccarat-bet-${key}`}
                                        key={key}
                                        onClick={() => setBetSide(key)}
                                        className={`baccarat-spot-btn ${type} ${betSide === key ? 'selected' : ''}`}
                                    >
                                        <div className="text-xl font-black uppercase tracking-wider mb-1">{label}</div>
                                        <div className="baccarat-spot-multiplier">{sub}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Chips */}
                            <div className="mb-8 scale-110">
                                <ChipSelector
                                    preset="high"
                                    selectedChip={bet}
                                    onSelectChip={setBet}
                                    idPrefix="baccarat"
                                />
                            </div>

                            <button
                                id="baccarat-deal-btn"
                                onClick={handleDeal}
                                disabled={!betSide || bet > balance}
                                className="baccarat-deal-btn tactile-button w-full md:w-64 mx-auto"
                            >
                                Deal
                            </button>
                        </motion.div>
                    )}
                </main>
            </Table>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                type={won ? 'win' : 'loss'}
                title={result === 'tie' ? 'Tie!' : `${result === 'player' ? 'Player' : 'Banker'} Wins!`}
                amount={won ? `+$${(() => {
                    if (betSide === 'tie') return bet * 8;
                    if (betSide === 'banker') return Math.floor(bet * 0.95);
                    return bet;
                })()}` : `-$${bet}`}
                content={(
                    <div className="flex flex-col items-center">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-white/40 mb-1">Player</span>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border-2 ${result === 'player' ? 'bg-blue-600 border-white/40 shadow-lg shadow-blue-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                    {playerTotal}
                                </div>
                            </div>
                            <div className="text-white/20 font-black italic">VS</div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-white/40 mb-1">Banker</span>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border-2 ${result === 'banker' ? 'bg-amber-600 border-white/40 shadow-lg shadow-amber-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                    {bankerTotal}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest text-white/50">
                            Bet on: <span className="text-white">{betSide}</span>
                        </p>
                    </div>
                )}
                onPlayAgain={handleNewRound}
                playAgainLabel="New Round"
            />

            <HowToPlay gameName="Baccarat" rules={BACCARAT_RULES} steps={BACCARAT_STEPS} tips={BACCARAT_TIPS} />
        </div>
    );
}

export default Baccarat;
