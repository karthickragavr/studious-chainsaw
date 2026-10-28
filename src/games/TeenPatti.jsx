import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, CircleDollarSign, Coins, Eye, EyeOff, ShieldAlert, BadgeCheck, AlertCircle, ChevronRight, XCircle, TrendingUp } from 'lucide-react';
import Table from '../components/Table';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import ResultModal from '../components/ResultModal';
import HowToPlay from '../components/HowToPlay';
import { useWallet } from '../hooks/useWallet';
import { useBetHistory } from '../hooks/useBetHistory';
import { useAchievements } from '../hooks/useAchievements';
import { evaluateHand, getBotAction } from './utils/TeenPattiLogic';
import { playWinJingle, playLossStinger } from '../utils/sounds';

const TP_RULES = [
    "You play against 2 AI Bots.",
    "Pay the Ante to start. Everyone is dealt 3 cards face down.",
    "Play 'Blind' (cards hidden, bets cost 1x) or 'Seen' (cards visible, bets cost 2x).",
    "On your turn you can: Fold (quit), Call (match bet), or Raise (increase bet).",
    "Game ends when all but 1 fold, or a Show is triggered.",
    "Highest hand wins: Trail > Pure Sequence > Sequence > Color > Pair > High Card."
];

const TP_STEPS = [
    { title: "Ante", desc: "Select a chip size. This will be the base bet." },
    { title: "Bet Or Fold", desc: "Decide to stay in or drop out. You can look at your cards anytime." },
    { title: "Showdown", desc: "When only 2 remain, a 'Show' reveals cards." }
];

const TP_TIPS = [
    "Playing Blind is cheaper but riskier.",
    "Bots play loosely when blind, but aggressively with strong hands when seen.",
    "A-2-3 is the highest Pure Sequence, higher than A-K-Q."
];

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
    return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function shuffle(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

const BOT_NAMES = ['Arjun', 'Priya', 'Rahul', 'Meera', 'Vikram', 'Ananya', 'Karan', 'Divya', 'Rohan', 'Sneha', 'Aditya', 'Kavya', 'Dev', 'Neha', 'Amit'];

function getRandomBotNames() {
    const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
}

const INITIAL_PLAYERS = [
    { id: 0, name: 'You', hand: [], isBlind: true, isActive: true, totalBet: 0 },
    { id: 1, name: 'Bot', hand: [], isBlind: true, isActive: true, totalBet: 0 },
    { id: 2, name: 'Bot', hand: [], isBlind: true, isActive: true, totalBet: 0 },
];

const TeenPatti = () => {
    const { balance, updateBalance } = useWallet();
    const { logBet } = useBetHistory();
    const { unlockAchievement } = useAchievements();

    const [phase, setPhase] = useState('ante'); // 'ante', 'playing', 'showdown', 'result'
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [pot, setPot] = useState(0);
    const [currentBetLevel, setCurrentBetLevel] = useState(0); // The base blind bet cost
    const [activeTurn, setActiveTurn] = useState(-1);

    // UI state
    const [selectedChip, setSelectedChip] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);

    // Force show
    const getActivePlayers = () => players.filter(p => p.isActive);

    const placeAnte = useCallback(() => {
        if (balance < selectedChip * 3) return; // Need at least 3x ante to play comfortably

        const shuffledDeck = shuffle(buildDeck());
        const [bot1Name, bot2Name] = getRandomBotNames();
        const newPlayers = INITIAL_PLAYERS.map((p, idx) => ({
            ...p,
            name: idx === 0 ? 'You' : idx === 1 ? bot1Name : bot2Name,
            hand: shuffledDeck.slice(idx * 3, idx * 3 + 3),
            totalBet: selectedChip,
            isActive: true,
            isBlind: true
        }));

        updateBalance(-selectedChip);

        setPlayers(newPlayers);
        setPot(selectedChip * 3); // 3 antes
        setCurrentBetLevel(selectedChip);
        setPhase('playing');
        setActiveTurn(0);
    }, [balance, selectedChip, updateBalance]);

    // Proceed to next turn
    const advanceTurn = useCallback((currentPlayers = players) => {
        const active = currentPlayers.filter(p => p.isActive);
        if (active.length === 1) {
            // Only 1 left, they win
            handleWin(active[0].id, currentPlayers, 'Everyone else folded!');
            return -1;
        }

        if (active.length === 2 && pot > currentBetLevel * 20) {
            // Force showdown if pot is getting too big for 2 players
            triggerShowdown(currentPlayers);
            return -1;
        }

        let nextTurn = (activeTurn + 1) % 3;
        while (!currentPlayers[nextTurn].isActive) {
            nextTurn = (nextTurn + 1) % 3;
        }

        setActiveTurn(nextTurn);
        return nextTurn;
    }, [activeTurn, pot, currentBetLevel]);

    const handleAction = useCallback((playerId, action, amount = 0, isNowSeen = false) => {
        const next = [...players];
        const p = { ...next[playerId] };

        if (isNowSeen && p.isBlind) {
            p.isBlind = false;
        }

        let cost = 0;
        let newBetLevel = currentBetLevel;
        let newPot = pot;

        if (action === 'fold') {
            p.isActive = false;
        } else if (action === 'call' || action === 'raise') {
            cost = currentBetLevel;
            if (!p.isBlind) cost *= 2;

            if (action === 'raise') {
                cost *= 2;
                newBetLevel = cost / (!p.isBlind ? 2 : 1);
            }

            p.totalBet += cost;
            newPot += cost;
        }

        next[playerId] = p;

        setPlayers(next);
        if (newBetLevel !== currentBetLevel) setCurrentBetLevel(newBetLevel);
        if (newPot !== pot) setPot(newPot);
        if (playerId === 0 && cost > 0) updateBalance(-cost);

        return next;
    }, [players, currentBetLevel, pot, updateBalance]);

    // Bot AI loop
    useEffect(() => {
        if (phase !== 'playing' || activeTurn === -1 || activeTurn === 0) return;

        const timer = setTimeout(() => {
            const bot = players[activeTurn];
            const decision = getBotAction(bot, currentBetLevel, pot);

            const updatedPlayers = handleAction(activeTurn, decision.action, decision.amount, !decision.isBlind);
            advanceTurn(updatedPlayers);
        }, 1500);

        return () => clearTimeout(timer);
    }, [activeTurn, phase, players, currentBetLevel, pot, handleAction, advanceTurn]);

    const triggerShowdown = (currentPlayers = players) => {
        setPhase('showdown');

        const active = currentPlayers.filter(p => p.isActive);
        let bestPlayer = null;
        let bestEval = { score: -1 };

        active.forEach(p => {
            const evaluation = evaluateHand(p.hand);
            if (evaluation.score > bestEval.score) {
                bestEval = evaluation;
                bestPlayer = p;
            }
        });

        // Reveal all active players' cards
        setPlayers(prev => prev.map(p => p.isActive ? { ...p, isBlind: false } : p));

        // Wait 3 seconds to let everyone see the cards before showing the modal
        setTimeout(() => {
            handleWin(bestPlayer.id, currentPlayers, `Won with ${bestEval.rankString}!`);
        }, 3000);
    };

    const handleWin = (winnerId, currentPlayers, reason) => {
        setPhase('result');
        const isHuman = winnerId === 0;

        if (isHuman) {
            updateBalance(pot);
            playWinJingle();
            if (pot > 500) unlockAchievement('teentitan');
            logBet('teenpatti', currentBetLevel, pot, true);
        } else {
            playLossStinger();
            logBet('teenpatti', currentBetLevel, pot, false);
        }

        setModalData({
            type: isHuman ? 'win' : 'loss',
            title: isHuman ? 'You Win!' : `${currentPlayers[winnerId].name} Wins`,
            amount: isHuman ? `+$${pot.toLocaleString()}` : `-$${currentPlayers[0].totalBet.toLocaleString()}`,
            reason: reason,
            winnerHand: isHuman ? null : currentPlayers[winnerId].hand // show bot's hand if they won
        });

        setTimeout(() => setShowModal(true), 1000);
    };

    const resetGame = () => {
        setShowModal(false);
        setPhase('ante');
        setPlayers(INITIAL_PLAYERS);
        setPot(0);
        setCurrentBetLevel(0);
        setActiveTurn(-1);
    };

    // Human actions
    const onSeeCards = () => {
        setPlayers(prev => {
            const n = [...prev];
            n[0] = { ...n[0], isBlind: false };
            return n;
        });
    };

    const onHumanAction = (action) => {
        if (activeTurn !== 0 || phase !== 'playing') return;
        const updatedPlayers = handleAction(0, action, 0, !players[0].isBlind);

        // Wait a frame to let state update before advancing
        setTimeout(() => {
            advanceTurn(updatedPlayers);
        }, 500);
    };

    const onShow = () => {
        if (activeTurn !== 0 || phase !== 'playing') return;
        const activeCount = players.filter(p => p.isActive).length;
        if (activeCount !== 2) return; // Can only "Show" if 2 left

        // Pay the cost to show
        const cost = players[0].isBlind ? currentBetLevel : currentBetLevel * 2;
        updateBalance(-cost);
        setPot(curr => curr + cost);

        triggerShowdown(players);
    };


    const humanCost = players[0].isBlind ? currentBetLevel : currentBetLevel * 2;

    return (
        <Table layout="3d" variant="baccarat">
            <main className="tp-container relative z-10 w-full h-full flex flex-col items-center justify-between p-4 max-w-5xl mx-auto">

                {/* ── Info Bar ── */}
                <div className="tp-header w-full flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md mt-14 md:mt-2">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Teen Patti</h2>
                        <p className="text-white/60 text-sm font-medium">Solo vs Bots</p>
                    </div>
                    <div className="text-right pr-12 md:pr-16">
                        <p className="text-white/60 text-sm uppercase tracking-wider">Pot</p>
                        <p className="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                            ${pot.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* ── Table Area (Bots) ── */}
                <div className="flex-1 w-full flex items-center justify-around translate-y-8">
                    {[1, 2].map(idx => {
                        const bot = players[idx];
                        const isTurn = activeTurn === idx;
                        return (
                            <div key={idx} className={`tp-bot-area ${isTurn ? 'tp-active-turn' : ''} ${!bot.isActive ? 'opacity-40 grayscale' : ''} ${phase === 'showdown' ? 'tp-showdown' : ''}`}>
                                <div className="tp-bot-avatar">
                                    {bot.name}
                                    {!bot.isActive && <div className="tp-status-badge text-red-500">Folded</div>}
                                    {bot.isActive && isTurn && <div className="tp-status-badge text-amber-400 animate-pulse">Thinking...</div>}
                                    {bot.isActive && !isTurn && <div className="tp-status-badge text-blue-400">{bot.isBlind ? 'Blind' : 'Seen'}</div>}
                                </div>
                                <div className="tp-bot-cards">
                                    <AnimatePresence>
                                        {bot.hand.map((card, i) => (
                                            <motion.div
                                                key={`b${idx}-${i}`}
                                                initial={{ y: -50, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <Card
                                                    suit={card.suit}
                                                    value={card.value}
                                                    isFaceUp={phase === 'showdown' || (showModal && modalData?.winnerHand)}
                                                    className="tp-mini-card"
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <div className="tp-bot-bet">Bet: ${bot.totalBet}</div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Human Area ── */}
                <div className="tp-human-area w-full max-w-2xl mt-auto relative z-20 pb-4">
                    {phase === 'ante' && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-6 bg-black/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Place Ante</h3>
                            <ChipSelector selectedChip={selectedChip} onSelectChip={setSelectedChip} />
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={placeAnte}
                                className="tactile-button tactile-button-gold px-10 py-4 text-xl tracking-wider w-full"
                            >
                                DEAL CARDS
                            </motion.button>
                        </motion.div>
                    )}

                    {phase !== 'ante' && (
                        <div className={`p-6 rounded-3xl border transition-all ${activeTurn === 0 ? 'bg-amber-900/30 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-black/60 border-white/10'}`}>

                            {/* Human Cards */}
                            <div className="flex justify-center -mt-16 mb-6">
                                {players[0].hand.map((card, i) => (
                                    <motion.div
                                        key={`h-${i}`}
                                        initial={{ y: 100, opacity: 0, rotate: i * 10 - 10 }}
                                        animate={{ y: 0, opacity: 1, rotate: i * 10 - 10 }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="transform hover:-translate-y-4 transition-transform z-10"
                                        style={{ marginLeft: i === 0 ? 0 : '-30px' }}
                                    >
                                        <Card
                                            suit={card.suit}
                                            value={card.value}
                                            isFaceUp={!players[0].isBlind || phase === 'showdown'}
                                            className="w-24 h-36 md:w-32 md:h-48 shadow-2xl"
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Human Controls */}
                            {players[0].isActive ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-4">
                                        <div className="text-white/80 font-bold uppercase tracking-wider">{players[0].isBlind ? 'Playing Blind' : 'Playing Seen'}</div>
                                        <div className="text-amber-400 font-bold">Your Bet: ${players[0].totalBet}</div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {players[0].isBlind && activeTurn === 0 && (
                                            <button onClick={onSeeCards} className="tp-btn tactile-button tactile-button-blue w-full mb-2">
                                                <Eye className="w-5 h-5 mr-2" /> See Cards
                                            </button>
                                        )}

                                        <button
                                            disabled={activeTurn !== 0}
                                            onClick={() => onHumanAction('fold')}
                                            className="tp-btn tactile-button tactile-button-red disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5 mr-2" /> Fold
                                        </button>

                                        <button
                                            disabled={activeTurn !== 0}
                                            onClick={() => onHumanAction('call')}
                                            className="tp-btn tactile-button tactile-button-emerald disabled:opacity-50"
                                        >
                                            <Coins size={16} className="w-5 h-5 mr-2" /> Call ${humanCost}
                                        </button>

                                        <button
                                            disabled={activeTurn !== 0}
                                            onClick={() => onHumanAction('raise')}
                                            className="tp-btn tactile-button tactile-button-gold disabled:opacity-50"
                                        >
                                            <TrendingUp className="w-5 h-5 mr-2" /> Raise ${humanCost * 2}
                                        </button>

                                        {players.filter(p => p.isActive).length === 2 && activeTurn === 0 && (
                                            <button
                                                onClick={onShow}
                                                className="tp-btn tactile-button w-full mt-2"
                                                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 0 #4c1d95, 0 0 15px rgba(124,58,237,0.3)' }}
                                            >
                                                Force Show (${humanCost})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-red-500 font-bold uppercase tracking-widest py-4 bg-red-950/30 rounded-xl">
                                    You Folded
                                </div>
                            )}

                        </div>
                    )}
                </div>

                <HowToPlay gameName="Teen Patti" rules={TP_RULES} steps={TP_STEPS} tips={TP_TIPS} />
            </main>

            {/* Result Modal */}
            <ResultModal
                isOpen={showModal}
                type={modalData?.type}
                title={modalData?.title}
                amount={modalData?.amount}
                content={(
                    <div className="flex flex-col items-center gap-4 text-sm font-bold uppercase tracking-widest text-white/50">
                        <p className="text-amber-400 text-center break-words whitespace-normal px-4">{modalData?.reason}</p>

                        {/* Only show evaluate result of hand if they went to showdown */}
                        {modalData?.winnerHand && (
                            <div className="flex gap-2 justify-center mt-2 scale-50">
                                {modalData.winnerHand.map((c, i) => (
                                    <Card key={i} suit={c.suit} value={c.value} isFaceUp={true} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                onPlayAgain={resetGame}
            />
        </Table>
    );
};

export default TeenPatti;
