import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const BADGES = {
    new: { label: 'NEW', className: 'badge-chip badge-new' },
    hot: { label: 'HOT', className: 'badge-chip badge-hot' },
    live: { label: 'LIVE', className: 'badge-chip badge-live' },
};

const GameCard = ({ title, description, preview, onClick, delay = 0, comingSoon = false, badge = null }) => {
    const badgeDef = badge ? BADGES[badge] : null;
    return (
        <motion.div
            id={`game-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            onClick={comingSoon ? undefined : onClick}
            className={`group game-card-wrapper ${comingSoon ? 'game-card-wrapper-disabled' : 'game-card-wrapper-active'}`}
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--glass-border)'
            }}
        >
            {/* Background Preview */}
            <div className="game-card-bg-container" style={{ backgroundColor: 'var(--bg-deep)' }}>
                <div
                    className="game-card-bg-gradient"
                    style={{
                        background: `linear-gradient(to top, var(--bg-deep) 0%, var(--bg-deep) 40%, transparent 100%)`
                    }}
                />
                <div
                    className="game-card-bg-overlay"
                    style={{ backgroundColor: 'var(--bg-deep)' }}
                />
                <motion.div
                    whileHover={comingSoon ? {} : { scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className={`game-card-preview-container ${comingSoon ? 'game-card-preview-container-disabled' : 'game-card-preview-container-active'}`}
                >
                    <div className="game-card-preview-inner">
                        {preview}
                    </div>
                </motion.div>
            </div>

            {/* Badge */}
            {badgeDef && (
                <span className={badgeDef.className}>
                    {badge === 'live' && <span className="badge-live-dot" />}
                    {badgeDef.label}
                </span>
            )}

            {/* Content Container */}
            <div className="game-card-content">
                <div className="game-card-text-container">
                    <h3 className={`game-card-title ${comingSoon ? 'game-card-title-disabled' : 'game-card-title-active'}`} style={{ color: comingSoon ? 'var(--text-muted)' : 'var(--text-light)' }}>
                        {title}
                    </h3>
                    <p
                        className={`game-card-description ${comingSoon ? '' : 'game-card-description-active'}`}
                        style={{
                            color: 'var(--text-muted)',
                        }}
                    >
                        <span className={`${comingSoon ? '' : 'group-hover:hidden'} transition-opacity duration-300`}>{description}</span>
                        {!comingSoon && (
                            <span className="hidden group-hover:inline transition-opacity duration-300" style={{ color: 'var(--text-light)' }}>
                                {description}
                            </span>
                        )}
                    </p>
                </div>

                <div className="game-card-footer">
                    <span className={`game-card-action-text ${comingSoon ? 'game-card-action-text-disabled' : 'game-card-action-text-active'}`} style={{ color: comingSoon ? 'var(--text-muted)' : 'var(--accent-primary)' }}>
                        {comingSoon ? 'COMING SOON' : 'Play Game'}
                    </span>
                    <motion.div
                        className={`game-card-action-icon ${comingSoon ? 'game-card-action-icon-disabled' : 'game-card-action-icon-active'}`}
                    >
                        {comingSoon ? (
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                        ) : (
                            <ArrowRight size={18} />
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default GameCard;
