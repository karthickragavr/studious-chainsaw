import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Frown, Equal, ArrowRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getBackTarget } from '../utils/returnContext';

/**
 * ResultModal - Standardized game result popup
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} type - 'win', 'loss', 'draw'
 * @param {string} title - Main header text (e.g., "Royale Win!")
 * @param {string} amount - Main transaction text (e.g., "+$500")
 * @param {React.ReactNode} content - Game-specific detailed stats
 * @param {function} onPlayAgain - Primary action callback
 * @param {string} playAgainLabel - Custom label for primary button
 */
const ResultModal = ({
    isOpen,
    type = 'win',
    title,
    amount,
    content,
    onPlayAgain,
    playAgainLabel = 'Play Again'
}) => {
    const config = {
        win: {
            icon: <Trophy className="text-amber-400" size={48} />,
            colorClass: 'text-amber-400',
            bgGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.2)]',
            borderClass: 'border-amber-500/30'
        },
        loss: {
            icon: <Frown className="text-red-400" size={48} />,
            colorClass: 'text-red-400',
            bgGlow: 'shadow-[0_0_50px_rgba(239,68,68,0.15)]',
            borderClass: 'border-red-500/20'
        },
        draw: {
            icon: <Equal className="text-slate-400" size={48} />,
            colorClass: 'text-slate-300',
            bgGlow: 'shadow-[0_0_50px_rgba(148,163,184,0.1)]',
            borderClass: 'border-white/10'
        }
    };

    const { icon, colorClass, bgGlow, borderClass } = config[type] || config.win;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="result-modal-overlay"
                    onClick={onPlayAgain}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        className={`result-modal-panel ${bgGlow} ${borderClass}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative Top Border */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${type === 'win' ? 'from-amber-500 via-yellow-400 to-amber-500' : type === 'loss' ? 'from-red-600 via-red-400 to-red-600' : 'from-slate-600 via-slate-400 to-slate-600'}`} />

                        {/* Status Icon */}
                        <div className="flex justify-center mb-6">
                            <motion.div
                                initial={{ rotate: -15, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="result-modal-icon-container"
                            >
                                {icon}
                            </motion.div>
                        </div>

                        {/* Title */}
                        <h2 className={`result-modal-title ${colorClass}`}>
                            {title}
                        </h2>

                        {/* Amount */}
                        <div className="result-modal-amount-container">
                            <span className={`result-modal-amount ${colorClass}`}>
                                {amount}
                            </span>
                        </div>

                        {/* Game Specific Content */}
                        {content && (
                            <div className="result-modal-content flex flex-col items-center justify-center w-full">
                                {content}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-4 mt-8">
                            <button
                                id="modal-play-again-btn"
                                onClick={onPlayAgain}
                                className={`result-modal-primary-btn tactile-button ${type === 'win' ? 'tactile-button-gold' : type === 'loss' ? 'tactile-button-red' : ''}`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    {playAgainLabel}
                                    <ArrowRight size={20} />
                                </div>
                            </button>

                            <BackLink />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Returns to wherever this game was launched from (lobby, world, missions…)
const BackLink = () => {
    const location = useLocation();
    const target = getBackTarget(location.pathname);
    return (
        <Link to={target.path} className="result-modal-secondary-btn">
            <div className="flex items-center justify-center gap-2">
                <Home size={16} />
                Back to {target.label}
            </div>
        </Link>
    );
};

export default ResultModal;
