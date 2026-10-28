import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultModal from '../components/ResultModal';

import { useRummy } from '../hooks/useRummy';
import { useWallet } from '../hooks/useWallet';
import { useRoundGuard } from '../hooks/useRoundGuard';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import HowToPlay from '../components/HowToPlay';
import { playCardSnap, playWinJingle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';

const RUMMY_RULES = [
    "This is Gin Rummy — you vs an AI opponent.",
    "Each player gets 10 cards. Form melds (sets or runs) to reduce deadwood.",
    "A set is 3–4 cards of the same value. A run is 3+ consecutive cards of the same suit.",
    "Deadwood = unmatched cards. Face cards = 10, Ace = 1.",
    "Knock when your deadwood is 10 or less. Gin = 0 deadwood!",
    "If the opponent's deadwood is lower when you knock, they undercut you!",
];

const RUMMY_STEPS = [
    "Place your bet and click 'Deal'.",
    "On your turn, draw from the deck or the discard pile.",
    "Select a card from your hand to discard.",
    "Form melds to reduce your deadwood score.",
    "When your deadwood is ≤ 10 (with exactly 10 cards), click 'Knock' to end the round.",
];

const RUMMY_TIPS = [
    "Watch what the AI picks from the discard pile — it reveals what they're collecting.",
    "Discard high-value cards first if they're not part of a meld.",
    "Going for Gin (0 deadwood) earns a bonus!",
];

function Rummy() {
    const {
        playerHand, aiHand, discardPile, deck, phase, result, message,
        playerDeadwood, aiDeadwood, dealGame, drawFromDeck, drawFromDiscard,
        discardCard, knock, resetGame
    } = useRummy();

    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();
    const [bet, setBet] = useState(100);
    const [showResult, setShowResult] = useState(false);

    const handleDeal = () => {
        if (bet > balance) return;
        updateBalance(-bet);
        dealGame();
    };

    useEffect(() => {
        if (phase === 'result' && result) {
            const timer = setTimeout(() => {
                if (result === 'gin') {
                    updateBalance(bet * 4);
                    addTransaction('win', bet * 3, 'Rummy');
                    logBet('Rummy', bet, 'win', bet * 4, { result: 'gin' });
                    unlockAchievement('first_win');
                    playWinJingle();
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
                } else if (result === 'player') {
                    updateBalance(bet * 2);
                    addTransaction('win', bet, 'Rummy');
                    logBet('Rummy', bet, 'win', bet * 2, { result: 'knock' });
                    unlockAchievement('first_win');
                    playWinJingle();
                    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                } else if (result === 'draw') {
                    updateBalance(bet);
                    logBet('Rummy', bet, 'draw', bet);
                } else {
                    addTransaction('loss', -bet, 'Rummy');
                    logBet('Rummy', bet, 'loss', 0, { result });
                    playLossStinger();
                }
                if (balance >= 10000) unlockAchievement('balance_10k');
                if (balance >= 50000) unlockAchievement('balance_50k');
                setShowResult(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [phase, result]);

    const handleNewRound = () => {
        setShowResult(false);
        resetGame();
    };

    const topDiscard = discardPile[discardPile.length - 1];
    const canKnock = phase === 'draw' && playerHand.length === 10 && playerDeadwood <= 10;

    const resultInfo = {
        gin: { title: 'GIN!', color: 'from-amber-400 to-yellow-500', text: `Won $${bet * 3}!` },
        player: { title: 'You Win!', color: 'from-emerald-400 to-green-500', text: `Won $${bet}!` },
        ai: { title: 'AI Wins!', color: 'from-red-400 to-red-600', text: `Lost $${bet}` },
        undercut: { title: 'Undercut!', color: 'from-red-400 to-orange-500', text: `Lost $${bet}` },
        draw: { title: 'Draw', color: 'from-slate-400 to-slate-500', text: 'Bet returned' },
    };

    // Hand the stake back if the player leaves before this round settles
    const stakeAtRisk = ['draw', 'discard', 'aiTurn'].includes(phase) || (phase === 'result' && !showResult) ? bet : 0;
    useRoundGuard('Rummy', stakeAtRisk);

    return (
        <div className="rummy-container" style={{ backgroundColor: 'var(--bg-deep)' }}>
            <div className="rummy-main-area">
                {/* AI Section */}
                <div className="rummy-ai-section">
                    <div className="rummy-ai-header">
                        <span className="rummy-ai-label">AI Opponent</span>
                        {phase === 'result' && (
                            <span className="rummy-ai-deadwood" style={{ color: 'var(--text-muted)' }}>Deadwood: {aiDeadwood}</span>
                        )}
                    </div>
                    <div className="rummy-ai-cards-container">
                        {aiHand.map((card, i) => (
                            <div key={card.id} className="rummy-ai-card-wrapper">
                                <Card
                                    suit={card.suit}
                                    value={card.value}
                                    isFaceUp={phase === 'result'}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center — Deck and Discard */}
                <div className="rummy-center-section">
                    {/* Deck */}
                    <div className="rummy-deck-container">
                        <button
                            id="rummy-deck-btn"
                            onClick={() => { drawFromDeck(); playCardSnap(); }}
                            disabled={phase !== 'draw'}
                            className="rummy-deck-btn"
                        >
                            <span className="rummy-deck-count">{deck.length}</span>
                        </button>
                        <span className="rummy-deck-label" style={{ color: 'var(--text-muted)' }}>Deck</span>
                    </div>

                    {/* Discard Pile */}
                    <div className="rummy-discard-container">
                        {topDiscard ? (
                            <button
                                id="rummy-discard-btn"
                                onClick={() => { drawFromDiscard(); playCardSnap(); }}
                                disabled={phase !== 'draw'}
                                className={`rummy-discard-btn ${phase === 'draw' ? 'rummy-discard-btn-active' : ''}`}
                            >
                                <Card suit={topDiscard.suit} value={topDiscard.value} isFaceUp={true} />
                            </button>
                        ) : (
                            <div className="rummy-discard-empty">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Empty</span>
                            </div>
                        )}
                        <span className="rummy-discard-label" style={{ color: 'var(--text-muted)' }}>Discard</span>
                    </div>
                </div>

                {/* Status Message */}
                <div className="rummy-status-panel">
                    <p className="rummy-status-message" style={{ color: 'var(--text-muted)' }}>{message}</p>
                    {phase !== 'betting' && phase !== 'result' && (
                        <p className="rummy-player-deadwood">Deadwood: {playerDeadwood}</p>
                    )}
                </div>

                {/* Knock Button */}
                {canKnock && (
                    <motion.button
                        id="rummy-knock-btn"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={knock}
                        className="rummy-knock-btn"
                    >
                        {playerDeadwood === 0 ? 'GIN!' : 'Knock'}
                    </motion.button>
                )}

                {/* Player Hand */}
                <div className="rummy-player-section">
                    <div className="rummy-player-header">
                        <span className="rummy-player-label">Your Hand</span>
                        <span className="rummy-player-count" style={{ color: 'var(--text-muted)' }}>{playerHand.length} cards</span>
                    </div>

                    {/* Scrollable container for mobile to prevent tiny cards */}
                    <div className="rummy-player-cards-scroll-area">
                        <div className="rummy-player-cards-container">
                            {playerHand.map((card, i) => (
                                <motion.div
                                    key={card.id}
                                    whileHover={{ y: -15, zIndex: 100, scale: 1.1 }}
                                    whileTap={{ y: -15, zIndex: 100 }}
                                    onClick={() => { if (phase === 'discard') { discardCard(card.id); playCardSnap(); } }}
                                    className={`rummy-player-card-wrapper ${phase === 'discard' ? 'rummy-player-card-wrapper-discard' : ''}`}
                                    style={{ zIndex: i }}
                                >
                                    <div className="rummy-player-card-inner">
                                        <Card suit={card.suit} value={card.value} isFaceUp={true} />
                                    </div>
                                    {/* Selection Indicator or Hover Hint */}
                                    {phase === 'discard' && (
                                        <div className="rummy-discard-indicator">
                                            Discard
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Betting Phase */}
                {phase === 'betting' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rummy-betting-panel"
                    >
                        <ChipSelector
                            preset="high"
                            selectedChip={bet}
                            onSelectChip={setBet}
                            idPrefix="rummy"
                        />
                        <button
                            id="rummy-deal-btn"
                            onClick={handleDeal}
                            disabled={bet > balance}
                            className="rummy-deal-btn"
                        >
                            Deal — ${bet}
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                type={result === 'player' || result === 'gin' ? 'win' : (result === 'draw' ? 'draw' : 'loss')}
                title={resultInfo[result]?.title || 'Round Over'}
                amount={result === 'gin' ? `+$${bet * 4}` : (result === 'player' ? `+$${bet * 2}` : (result === 'draw' ? `$${bet}` : `-$${bet}`))}
                content={(
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] uppercase font-bold text-white/40">Your Hand</span>
                                <span className="text-sm font-black text-emerald-400">Deadwood: {playerDeadwood}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10 mx-4" />
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] uppercase font-bold text-white/40">AI Hand</span>
                                <span className="text-sm font-black text-red-400">Deadwood: {aiDeadwood}</span>
                            </div>
                        </div>
                        <p className="text-sm text-white/60 italic px-4">
                            {message}
                        </p>
                    </div>
                )}
                onPlayAgain={handleNewRound}
                playAgainLabel="New Game"
            />

            <HowToPlay gameName="Gin Rummy" rules={RUMMY_RULES} steps={RUMMY_STEPS} tips={RUMMY_TIPS} />
        </div>
    );
}

export default Rummy;
