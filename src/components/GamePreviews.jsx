import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Coins } from 'lucide-react';

export const MangathaPreview = () => (
    <div className="preview-mangatha-container">
        <div className="preview-mangatha-stack">
            {[1, 2, 3].map(i => (
                <motion.div
                    key={`l-${i}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.3, repeat: Infinity, duration: 2, repeatDelay: 1 }}
                    className="preview-mangatha-card-left"
                    style={{
                        backgroundColor: 'var(--card-paper)',
                        borderColor: 'var(--glass-border)',
                        color: '#1e293b'
                    }}
                >
                    🂠
                </motion.div>
            ))}
        </div>

        <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="preview-mangatha-card-center"
            style={{
                backgroundColor: 'var(--accent-primary)',
                borderColor: 'var(--accent-secondary)',
                boxShadow: '0 0 40px var(--accent-primary)'
            }}
        >
            🃏
        </motion.div>

        <div className="preview-mangatha-stack">
            {[1, 2, 3].map(i => (
                <motion.div
                    key={`r-${i}`}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.3, repeat: Infinity, duration: 2, repeatDelay: 1 }}
                    className="preview-mangatha-card-right"
                    style={{
                        backgroundColor: 'var(--card-paper)',
                        borderColor: 'var(--glass-border)',
                        color: 'var(--text-light)'
                    }}
                >
                    🂠
                </motion.div>
            ))}
        </div>
    </div>
);

export const BlackjackPreview = () => (
    <div className="preview-blackjack-container">
        <motion.div
            initial={{ x: -40, rotate: -25, opacity: 0 }}
            animate={{ x: -15, rotate: -15, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 3, repeatType: "reverse" }}
            className="preview-blackjack-card"
            style={{
                backgroundColor: 'var(--card-paper)',
                borderColor: 'var(--glass-border)',
                color: '#ef4444'
            }}
        >
            A♥
        </motion.div>
        <motion.div
            initial={{ x: 40, rotate: 25, opacity: 0 }}
            animate={{ x: 15, rotate: 15, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 3, repeatType: "reverse", delay: 0.5 }}
            className="preview-blackjack-card"
            style={{
                backgroundColor: 'var(--card-paper)',
                borderColor: 'var(--glass-border)',
                color: '#1e293b'
            }}
        >
            K♠
        </motion.div>
    </div>
);

export const RoulettePreview = () => (
    <div className="preview-roulette-container">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="preview-roulette-wheel"
            style={{
                borderColor: 'var(--bg-deep)',
                background: 'conic-gradient(#000 0% 10%, #991b1b 10% 20%, #000 20% 30%, #991b1b 30% 40%, #000 40% 50%, #991b1b 50% 60%, #000 60% 70%, #991b1b 70% 80%, #000 80% 90%, #991b1b 90% 100%)'
            }}
        >
            <div className="preview-roulette-inner-ring">
                <div className="preview-roulette-ring-line" />
            </div>
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="preview-roulette-ball"
                style={{ top: '10%', left: '45%' }}
            />
            <div
                className="preview-roulette-center"
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    borderColor: 'var(--bg-deep)'
                }}
            >
                <div className="preview-roulette-center-dot" style={{ backgroundColor: 'var(--bg-deep)' }} />
            </div>
        </motion.div>
    </div>
);

export const PokerPreview = () => (
    <div className="preview-poker-container">
        <div className="preview-poker-hand">
            {['10♠', 'J♠', 'Q♠', 'K♠', 'A♠'].map((card, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 30, rotate: -20, opacity: 0 }}
                    animate={{ y: 0, rotate: (i - 2) * 12, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: i * 0.15,
                    }}
                    className="preview-poker-card"
                    style={{
                        backgroundColor: 'var(--card-paper)',
                        borderColor: 'var(--glass-border)',
                        color: (card.includes('♥') || card.includes('♦')) ? '#ef4444' : '#1e293b'
                    }}
                >
                    {card}
                </motion.div>
            ))}
        </div>
        <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.90, 1.10, 0.90] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="preview-poker-rec-badge"
            style={{
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--glass)',
                borderColor: 'var(--glass-border)'
            }}
        >
            <Coins size={12} className="text-red-500" /> VIDEO POKER
        </motion.div>
    </div>
);

export const SlotsPreview = () => (
    <div className="preview-slots-container">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="preview-slots-reel"
                style={{
                    backgroundColor: 'var(--bg-deep)',
                    borderColor: 'var(--glass-border)'
                }}
            >
                <motion.div
                    animate={{ y: [0, -80, 0] }}
                    transition={{
                        duration: 0.4 + (i * 0.2),
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1.5
                    }}
                >
                    <div className="preview-slots-symbol">7️⃣</div>
                    <div className="preview-slots-symbol">🍒</div>
                    <div className="preview-slots-symbol">💎</div>
                    <div className="preview-slots-symbol">7️⃣</div>
                </motion.div>
            </motion.div>
        ))}
    </div>
);

export const BaccaratPreview = () => (
    <div className="preview-baccarat-container">
        <motion.div
            animate={{
                rotateY: 360,
                boxShadow: ['0 0 20px rgba(245,158,11,0.2)', '0 0 50px rgba(245,158,11,0.5)', '0 0 20px rgba(245,158,11,0.2)']
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="preview-baccarat-chip-main"
            style={{
                background: 'linear-gradient(to tr, var(--accent-primary), var(--accent-secondary))',
                borderColor: 'var(--accent-secondary)'
            }}
        >
            💲
        </motion.div>
        <div className="preview-baccarat-dots">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
        </div>
    </div>
);

export const GinRummyPreview = () => (
    <div className="preview-rummy-container">
        {['7♣', '8♣', '9♣'].map((card, i) => (
            <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: i * 25 - 25, opacity: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="preview-rummy-card"
                style={{
                    backgroundColor: 'var(--card-paper)',
                    borderColor: 'var(--glass-border)',
                    color: '#1e293b',
                    position: 'absolute',
                    width: '50px',
                    height: '70px',
                    zIndex: i
                }}
            >
                {card}
            </motion.div>
        ))}
    </div>
);

export const MultiplayerRummyPreview = () => (
    <div className="preview-rummy-container" style={{ perspective: '1000px' }}>
        {[0, 1, 2].map((stack, sIdx) => (
            <div key={sIdx} style={{ position: 'absolute', transform: `translateX(${(sIdx - 1) * 60}px) rotateY(${(sIdx - 1) * 20}deg)` }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: sIdx * 0.3 + i * 0.1 }}
                        className="preview-rummy-card"
                        style={{
                            backgroundColor: 'white',
                            borderColor: '#e5e7eb',
                            width: '40px',
                            height: '56px',
                            position: 'absolute',
                            top: i * 2,
                            left: i * 2,
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        🎴
                    </motion.div>
                ))}
            </div>
        ))}
    </div>
);

export const MultiplayerPokerPreview = () => (
    <div className="preview-mp-poker-container">
        <div className="preview-mp-poker-chips">
            {[
                { color: '#ef4444', delay: 0 },
                { color: '#3b82f6', delay: 0.2 },
                { color: '#10b981', delay: 0.4 },
                { color: '#8b5cf6', delay: 0.6 },
            ].map((chip, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -15, 0],
                        rotateX: [0, 20, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: chip.delay }}
                    className="preview-mp-poker-chip"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${chip.color}, #000)`,
                        borderColor: 'var(--glass-border)'
                    }}
                >
                    <div className="preview-mp-poker-chip-inner" />
                </motion.div>
            ))}
        </div>
        <div
            className="preview-mp-poker-label"
            style={{ color: 'var(--accent-primary)', opacity: 0.6 }}
        >
            Lobby Live
        </div>
    </div>
);

export const SicBoPreview = () => (
    <div className="preview-sicbo-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {[
            { delay: 0, finalRotate: 15, face: '⚅' },
            { delay: 0.2, finalRotate: -10, face: '⚂' },
            { delay: 0.4, finalRotate: 5, face: '⚄' }
        ].map((dice, i) => (
            <motion.div
                key={i}
                initial={{ y: -50, opacity: 0, rotate: 0 }}
                animate={{
                    y: [0, -20, 0, -10, 0],
                    opacity: 1,
                    rotate: [0, 180, 360, dice.finalRotate]
                }}
                transition={{
                    duration: 1.5,
                    delay: dice.delay,
                    repeat: Infinity,
                    repeatDelay: 2
                }}
                className="preview-sicbo-dice"
                style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: '#ef4444',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    border: '1px solid #e5e7eb'
                }}
            >
                {dice.face}
            </motion.div>
        ))}
    </div>
);

export const HiLoPreview = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px', height: '100%', width: '100%' }}>
        {/* Current card */}
        <motion.div
            animate={{ y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
                width: '52px', height: '74px', borderRadius: '8px', border: '2px solid #e5e7eb',
                backgroundColor: 'var(--card-paper)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', fontWeight: 900,
                color: '#ef4444', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
        >
            A♥
        </motion.div>

        {/* Animated arrow */}
        <motion.div
            animate={{ y: [0, -6, 0], color: ['#10b981', '#f59e0b', '#10b981'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '24px', fontWeight: 900 }}
        >
            ↑
        </motion.div>

        {/* Next card face-down */}
        <motion.div
            whileHover={{ rotateY: 180 }}
            transition={{ duration: 0.6 }}
            style={{
                width: '52px', height: '74px', borderRadius: '8px',
                backgroundColor: 'var(--card-back)', border: '2px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
        >
            <span style={{ fontSize: '22px', opacity: 0.4 }}>?</span>
        </motion.div>
    </div>
);

export const TeenPattiPreview = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'relative' }}>
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                whileHover={{ rotateY: 180 }}
                transition={{ duration: 0.4 }}
                style={{
                    position: 'absolute',
                    width: '46px', height: '66px', borderRadius: '6px',
                    backgroundColor: 'var(--card-back)', border: '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    transformOrigin: 'bottom center',
                    transform: `rotate(${(i - 1) * 15}deg) translateY(${-Math.abs(i - 1) * 5}px)`,
                    left: `calc(50% - 23px + ${(i - 1) * 15}px)`,
                    zIndex: i
                }}
            >
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gold)', opacity: 0.8,
                    boxShadow: '0 0 10px var(--gold)'
                }} />
            </motion.div>
        ))}
    </div>
);

export const KenoPreview = () => (
    <div className="preview-keno-container flex flex-wrap gap-1 p-4 w-full h-full justify-center items-center opacity-80"
        style={{
            backgroundColor: 'var(--bg-panel)'
        }}>
        {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
                key={i}
                className="w-1/5 aspect-square rounded-sm border border-emerald-500/20"
                style={{
                    backgroundColor: 'var(--bg-dark)'
                }}
                animate={{
                    backgroundColor: (i === 3 || i === 7 || i === 12) ? ['var(--bg-dark)', 'var(--accent-primary)', 'var(--bg-dark)'] : 'var(--bg-dark)',
                    borderColor: (i === 3 || i === 7 || i === 12) ? ['var(--glass-border)', 'var(--accent-secondary)', 'var(--glass-border)'] : 'var(--glass-border)',
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    repeatDelay: 1
                }}
            />
        ))}
    </div>
);

export const MultiplayerTeenPattiPreview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'relative' }}>
        <div style={{ position: 'relative', width: '60px', height: '80px', marginBottom: '10px' }}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    style={{
                        position: 'absolute',
                        width: '46px', height: '66px', borderRadius: '6px',
                        backgroundColor: 'var(--card-back)', border: '2px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        transformOrigin: 'bottom center',
                        transform: `rotate(${(i - 1) * 15}deg) translateY(${-Math.abs(i - 1) * 5}px)`,
                        left: `calc(50% - 23px + ${(i - 1) * 15}px)`,
                        zIndex: i
                    }}
                >
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gold)', opacity: 0.8,
                        boxShadow: '0 0 10px var(--gold)'
                    }} />
                </motion.div>
            ))}
        </div>
        <div
            style={{
                color: 'var(--gold)',
                backgroundColor: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}
        >
            Lobby Live
        </div>
    </div>
);

export const CrapsPreview = () => (
    <div className="preview-craps-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
            {[
                { delay: 0, finalRotate: -12, face: '⚃' },
                { delay: 0.25, finalRotate: 10, face: '⚂' },
            ].map((die, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -40, opacity: 0, rotate: 0 }}
                    animate={{
                        y: [0, -24, 0, -10, 0],
                        opacity: 1,
                        rotate: [0, 270, 360, die.finalRotate]
                    }}
                    transition={{
                        duration: 1.4,
                        delay: die.delay,
                        repeat: Infinity,
                        repeatDelay: 2.2
                    }}
                    style={{
                        width: '34px',
                        height: '34px',
                        backgroundColor: 'white',
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                        lineHeight: 1,
                        color: '#0f172a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.45)'
                    }}
                >
                    {die.face}
                </motion.div>
            ))}
        </div>
        <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
                color: 'var(--gold)',
                backgroundColor: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}
        >
            Point On
        </motion.div>
    </div>
);
