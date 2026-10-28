import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultModal from '../components/ResultModal';
import { useBlackjack } from '../hooks/useBlackjack';
import { useWallet } from '../hooks/useWallet';
import { useRoundGuard } from '../hooks/useRoundGuard';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';

import Table from '../components/Table';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import HowToPlay from '../components/HowToPlay';
import { playWinJingle, playLossStinger } from '../utils/sounds';
import confetti from 'canvas-confetti';

const BLACKJACK_RULES = [
    "Get as close to 21 as possible without going over.",
    "Face cards (J, Q, K) are worth 10. Aces are worth 1 or 11.",
    "Dealer must hit on 16 and stand on 17.",
    "Blackjack (Ace + 10-value) pays 3:2.",
    "Double Down lets you double your bet for exactly one more card.",
    "Split pairs into two hands (requires equal bet).",
    "Insurance pays 2:1 if dealer has Blackjack (requires half bet)."
];

const BLACKJACK_STEPS = [
    "Place your bet using the chips at the bottom.",
    "Click 'Deal'. If dealer shows an Ace, you can take Insurance.",
    "Choose: Hit, Stand, Double, or Split (if pair).",
    "Play each hand separately.",
    "Dealer plays after all your hands are done.",
    "Win 3:2 on Blackjack, 1:1 on normal wins."
];

const BLACKJACK_TIPS = [
    "Always stand on 17 or higher.",
    "Double down on 11 against a dealer's 2–10.",
    "Split Aces and Eights.",
    "Don't take insurance unless counting cards (or feeling lucky)."
];

const getCardValue = (value) => {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
};

const calculateHand = (cards) => {
    if (!cards) return 0;
    let total = cards.reduce((sum, card) => sum + getCardValue(card.value), 0);
    let aces = cards.filter(c => c.value === 'A').length;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
};

function Blackjack() {
    const {
        hands, activeHand, currentHandIndex, dealerHand, phase,
        dealerRevealed, dealerTotal,
        deal, hit, stand, doubleDown, split, resolveInsurance, resetGame,
        canSplit, insuranceAvailable, insuranceTaken, insuranceWin
    } = useBlackjack();

    const { balance, updateBalance, addTransaction } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    // Local State
    const [bet, setBet] = useState(100);
    const [showResult, setShowResult] = useState(false);
    const [roundProcessed, setRoundProcessed] = useState(false);

    // Initial Deal
    const handleDeal = () => {
        if (bet > balance) return;
        updateBalance(-bet);
        setRoundProcessed(false);
        setShowResult(false);
        deal();
    };

    // Actions
    const handleHit = () => {
        hit();
    };

    const handleStand = () => {
        stand();
    };

    const handleDouble = () => {
        if (bet > balance) return;
        if (doubleDown()) {
            updateBalance(-bet);
        }
    };

    const handleSplit = () => {
        if (bet > balance) return;
        if (split()) {
            updateBalance(-bet);
        }
    };

    const handleInsurance = (take) => {
        if (take) {
            const cost = bet / 2;
            if (cost > balance) return;
            updateBalance(-cost);
        }
        resolveInsurance(take);
    };

    const handleNewRound = () => {
        setShowResult(false);
        resetGame();
    };

    // Process Results
    useEffect(() => {
        if (phase === 'result' && !roundProcessed) {
            setRoundProcessed(true);

            let totalWinnings = 0;
            let resultSummaries = [];

            // 1. Calculate Hand Results
            hands.forEach((hand, idx) => {
                const handBet = bet * hand.betMultiplier;

                if (hand.result === 'blackjack') {
                    // 3:2 payout for user total bet return = Bet + 1.5*Bet = 2.5*Bet
                    totalWinnings += Math.floor(handBet * 1.5) + handBet;
                    resultSummaries.push(`Hand ${idx + 1}: Blackjack!`);
                } else if (hand.result === 'win') {
                    totalWinnings += handBet * 2;
                    resultSummaries.push(`Hand ${idx + 1}: Won`);
                } else if (hand.result === 'push') {
                    totalWinnings += handBet;
                    resultSummaries.push(`Hand ${idx + 1}: Push`);
                } else {
                    resultSummaries.push(`Hand ${idx + 1}: Lost`);
                }
            });

            // 2. Insurance Result
            if (insuranceTaken) {
                if (insuranceWin) {
                    // Pays 2:1. Returns bet/2 + 2*(bet/2) = 1.5*bet
                    totalWinnings += (bet / 2) * 3;
                    resultSummaries.push(`Insurance: Won`);
                } else {
                    resultSummaries.push(`Insurance: Lost`);
                }
            }

            // 3. Update Wallet & Stats
            if (totalWinnings > 0) {
                updateBalance(totalWinnings);
                playWinJingle();
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            }

            // Simple Stat Logging (Summarized)
            // Determine dominant result for simple logging
            const totalBetInvested = (bet * hands.reduce((sum, h) => sum + h.betMultiplier, 0)) + (insuranceTaken ? bet / 2 : 0);
            const netProfit = totalWinnings - totalBetInvested;

            // Break-even rounds (pushes, insurance cancelling a lost hand) aren't wins
            const outcome = netProfit > 0 ? 'win' : netProfit < 0 ? 'loss' : 'push';
            addTransaction(outcome, netProfit, 'Blackjack');
            logBet('Blackjack', bet, outcome, totalWinnings, { summaries: resultSummaries });
            if (netProfit < 0) playLossStinger();

            // Achievements
            if (hands.some(h => h.result === 'win' || h.result === 'blackjack')) unlockAchievement('first_win');
            if (hands.some(h => h.result === 'blackjack')) unlockAchievement('blackjack_natural');

            setTimeout(() => setShowResult(true), 800);
        }
    }, [phase, roundProcessed, hands, insuranceTaken, insuranceWin, bet, hands.length]);


    // Hand the stake back if the player leaves before this round settles
    const stakeAtRisk = (['playing', 'dealer', 'insurance'].includes(phase) || (phase === 'result' && !roundProcessed))
        ? bet * hands.reduce((sum, h) => sum + h.betMultiplier, 0) + (insuranceTaken ? bet / 2 : 0)
        : 0;
    useRoundGuard('Blackjack', stakeAtRisk);

    return (
        <div className="blackjack-container table-surface-spotlight table-felt-green">
            <Table>
                <main className="blackjack-main-area">

                    {/* Dealer Section */}
                    <div className="blackjack-dealer-section">
                        <div className="blackjack-dealer-label-container">
                            <span className="blackjack-dealer-label">Dealer</span>
                            {dealerHand.length > 0 && (
                                <span className="blackjack-dealer-total">
                                    {dealerRevealed ? dealerTotal : '?'}
                                </span>
                            )}
                        </div>

                        {/* Dealer Cards - Absolute Fan Pattern */}
                        <div className="blackjack-cards-fan">
                            {dealerHand.map((card, i) => {
                                const totalCards = dealerHand.length;
                                const offsetX = (i - (totalCards - 1) / 2) * 50;

                                return (
                                    <motion.div
                                        key={card.id || i}
                                        initial={{ y: -50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1, x: offsetX }}
                                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                                        className="blackjack-card-wrapper"
                                        style={{ zIndex: i }}
                                    >
                                        <Card
                                            suit={card.suit}
                                            value={card.value}
                                            isFaceUp={i === 0 || dealerRevealed}
                                            style={{ width: '80px', height: '112px' }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hands Container */}
                    <div className="blackjack-hands-container">
                        {hands.map((hand, index) => {
                            const isActive = index === currentHandIndex && phase === 'playing';
                            const handTotal = calculateHand(hand.cards);
                            return (
                                <div key={index} className={`blackjack-hand-wrapper ${phase === 'playing' && !isActive ? 'blackjack-hand-inactive' : 'blackjack-hand-active'}`}>
                                    <div className="blackjack-hand-header">
                                        <span className={`blackjack-hand-label ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
                                            Hand {index + 1}
                                        </span>
                                        <span className="blackjack-hand-total">
                                            {handTotal}
                                        </span>
                                        {isActive && <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto mt-1" />}
                                    </div>

                                    {/* Player Hand Cards - Absolute Fan Pattern */}
                                    <div className="blackjack-cards-fan relative h-28 mb-4">
                                        {hand.cards.map((card, i) => {
                                            const totalCards = hand.cards.length;
                                            const offsetX = (i - (totalCards - 1) / 2) * 40;

                                            return (
                                                <motion.div
                                                    key={card.id}
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1, x: offsetX }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="blackjack-card-wrapper"
                                                    style={{ zIndex: i }}
                                                >
                                                    <Card
                                                        suit={card.suit}
                                                        value={card.value}
                                                        isFaceUp={true}
                                                        style={{ width: '70px', height: '98px' }}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    <div className="blackjack-hand-bet">
                                        ${bet * hand.betMultiplier}
                                    </div>
                                    {hand.result && (
                                        <div className={`blackjack-hand-result ${hand.result === 'win' || hand.result === 'blackjack' ? 'text-green-400' : (hand.result === 'push' ? 'text-slate-300' : 'text-red-400')}`}>
                                            {hand.result}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons - Moved here to be below hands */}
                    {phase === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="blackjack-action-buttons"
                        >
                            <button id="blackjack-hit-btn" onClick={handleHit} className="blackjack-action-btn tactile-button-blue">
                                Hit
                            </button>
                            <button id="blackjack-stand-btn" onClick={handleStand} className="blackjack-action-btn tactile-button">
                                Stand
                            </button>

                            {activeHand?.cards?.length === 2 && bet <= balance && (
                                <button id="blackjack-double-btn" onClick={handleDouble} className="blackjack-action-btn tactile-button-gold">
                                    Double
                                </button>
                            )}

                            {canSplit && bet <= balance && (
                                <button id="blackjack-split-btn" onClick={handleSplit} className="blackjack-action-btn tactile-button-emerald">
                                    Split
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Insurance Modal */}
                    <AnimatePresence>
                        {phase === 'insurance' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                // framer owns `transform` here, so centre with its x/y rather than a translate class
                                style={{ x: '-50%', y: '-50%' }}
                                className="blackjack-insurance-modal max-w-[calc(100vw-2rem)]"
                            >
                                <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest">Insurance?</h3>
                                <p className="text-white/60 font-medium">Cost: ${bet / 2} — Pays 2:1</p>
                                <div className="flex gap-4 w-full">
                                    <button id="blackjack-insurance-yes" onClick={() => handleInsurance(true)} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase tracking-widest transition-all">Yes</button>
                                    <button id="blackjack-insurance-no" onClick={() => handleInsurance(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all">No</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Betting Phase */}
                    {phase === 'betting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="blackjack-betting-panel"
                        >
                            <div className="blackjack-bet-display">
                                <span className="blackjack-bet-label">Your Bet</span>
                                <p className="blackjack-bet-amount">${bet}</p>
                            </div>

                            <div className="scale-110 mb-4">
                                <ChipSelector
                                    preset="high"
                                    selectedChip={bet}
                                    onSelectChip={setBet}
                                    idPrefix="blackjack"
                                />
                            </div>

                            <button
                                id="blackjack-deal-btn"
                                onClick={handleDeal}
                                disabled={bet > balance}
                                className="blackjack-deal-btn tactile-button-gold w-full md:w-64"
                            >
                                Deal
                            </button>
                        </motion.div>
                    )}

                    <HowToPlay gameName="Blackjack" rules={BLACKJACK_RULES} steps={BLACKJACK_STEPS} tips={BLACKJACK_TIPS} />
                </main>
            </Table>

            {/* Result Overlay */}
            {/* Result Modal */}
            <ResultModal
                isOpen={showResult}
                type={hands.some(h => h.result === 'win' || h.result === 'blackjack') ? 'win' : (hands.every(h => h.result === 'push') ? 'draw' : 'loss')}
                title="Round Over"
                amount={(() => {
                    const totalBetInvested = (bet * hands.reduce((sum, h) => sum + h.betMultiplier, 0)) + (insuranceTaken ? bet / 2 : 0);
                    let totalWinnings = 0;
                    hands.forEach((hand) => {
                        const handBet = bet * hand.betMultiplier;
                        if (hand.result === 'blackjack') totalWinnings += Math.floor(handBet * 1.5) + handBet;
                        else if (hand.result === 'win') totalWinnings += handBet * 2;
                        else if (hand.result === 'push') totalWinnings += handBet;
                    });
                    if (insuranceTaken && insuranceWin) totalWinnings += (bet / 2) * 3;

                    const netProfit = totalWinnings - totalBetInvested;
                    return netProfit >= 0 ? `+$${netProfit}` : `-$${Math.abs(netProfit)}`;
                })()}
                content={(
                    <div className="w-full flex flex-col gap-2">
                        {hands.map((h, i) => {
                            const handBet = bet * h.betMultiplier;
                            let amount = 0;
                            if (h.result === 'blackjack') amount = Math.floor(handBet * 1.5);
                            else if (h.result === 'win') amount = handBet;
                            else if (h.result === 'lose' || h.result === 'bust') amount = -handBet;

                            return (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                    <div className="flex flex-col text-left">
                                        <span className="text-white/60 font-bold uppercase text-[10px] tracking-widest">Hand {i + 1}</span>
                                        <span className="text-amber-400/50 font-mono text-xs">Score: {calculateHand(h.cards)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-bold min-w-[60px] text-right ${amount > 0 ? 'text-emerald-400' : amount < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                            {amount > 0 ? `+$${amount}` : amount < 0 ? `-$${Math.abs(amount)}` : '$0'}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase min-w-[70px] ${h.result === 'blackjack' ? 'text-amber-400' :
                                            h.result === 'win' ? 'text-emerald-400' :
                                                h.result === 'push' ? 'text-slate-300' : 'text-red-400'
                                            }`}>
                                            {h.result}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {insuranceTaken && (
                            <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                                <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex-1 text-left">Insurance</span>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-bold min-w-[60px] text-right ${insuranceWin ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {insuranceWin ? `+$${bet}` : `-$${bet / 2}`}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase min-w-[70px] ${insuranceWin ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {insuranceWin ? 'WON' : 'LOST'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                onPlayAgain={handleNewRound}
                playAgainLabel="New Round"
            />
        </div>
    );
}

export default Blackjack;
