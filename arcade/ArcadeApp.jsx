import React, { useMemo, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, RefreshCw, Search, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { SoundProvider, useSound } from '../src/context/SoundContext';
import { useWallet } from '../src/hooks/useWallet';
import { SOLO_GAMES } from '../src/data/gameCatalog';
import GameCard from '../src/components/GameCard';
import { clearReturnContext } from '../src/utils/returnContext';
import { ArcadeWalletProvider, STARTING_BALANCE } from './ArcadeWalletProvider';
import { useBetHistory } from './local/useBetHistory';
import { summarize } from './local/betStore';
import Mangatha from '../src/games/Mangatha';
import Blackjack from '../src/games/Blackjack';
import Roulette from '../src/games/Roulette';
import Poker from '../src/games/Poker';
import Slots from '../src/games/Slots';
import Baccarat from '../src/games/Baccarat';
import Rummy from '../src/games/Rummy';
import SicBo from '../src/games/SicBo';
import Craps from '../src/games/Craps';
import HiLo from '../src/games/HiLo';
import TeenPatti from '../src/games/TeenPatti';
import Keno from '../src/games/Keno';

// Same paths as the main app, so the games' own "back to lobby" links
// (returnContext → '/') land on the arcade home.
const GAME_COMPONENTS = {
    '/mangatha': Mangatha,
    '/blackjack': Blackjack,
    '/roulette': Roulette,
    '/poker': Poker,
    '/slots': Slots,
    '/baccarat': Baccarat,
    '/rummy': Rummy,
    '/sicbo': SicBo,
    '/craps': Craps,
    '/hilo': HiLo,
    '/teenpatti': TeenPatti,
    '/keno': Keno,
};

const ARCADE_GAMES = SOLO_GAMES.filter(g => GAME_COMPONENTS[g.path]);

const ArcadeHeader = () => {
    const { balance, refill } = useWallet();
    const { isMuted, toggleMute } = useSound();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="arcade-header">
            <Link to="/" className="arcade-brand premium-gradient-text" onClick={clearReturnContext}>
                PlayMangatha <span className="arcade-brand-tag">Arcade</span>
            </Link>
            <div className="arcade-header-actions">
                <span className="arcade-balance" aria-label="Play-money balance">
                    <Coins size={16} /> {balance.toLocaleString()}
                </span>
                {balance < STARTING_BALANCE && (
                    <button onClick={refill} className="arcade-icon-btn" title={`Refill to ${STARTING_BALANCE}`} aria-label="Refill chips">
                        <RefreshCw size={16} />
                    </button>
                )}
                <button onClick={toggleMute} className="arcade-icon-btn" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button onClick={toggleTheme} className="arcade-icon-btn" aria-label="Toggle theme">
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
        </header>
    );
};

// The visitor's own record, read from this browser. Hidden until the first
// round so a new visitor sees the games, not a row of zeros.
const ArcadeStats = () => {
    const { bets } = useBetHistory();
    const { rounds, wins, winRate, net } = summarize(bets);
    if (rounds === 0) return null;

    const stats = [
        { label: 'Rounds', value: rounds.toLocaleString() },
        { label: 'Wins', value: wins.toLocaleString() },
        { label: 'Win rate', value: `${winRate}%` },
        { label: 'Net chips', value: `${net > 0 ? '+' : ''}${net.toLocaleString()}`, tone: net > 0 ? 'up' : net < 0 ? 'down' : null },
    ];

    return (
        <dl className="arcade-stats" aria-label="Your record in this browser">
            {stats.map(s => (
                <div key={s.label} className="arcade-stat">
                    <dt>{s.label}</dt>
                    <dd className={s.tone ? `arcade-stat-${s.tone}` : undefined}>{s.value}</dd>
                </div>
            ))}
        </dl>
    );
};

const ArcadeHome = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const games = useMemo(() => {
        const q = query.trim().toLowerCase();
        return ARCADE_GAMES.filter(g =>
            q === '' || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
        );
    }, [query]);

    const onPlay = (game) => {
        clearReturnContext();
        navigate(game.path);
    };

    return (
        <div className="landing-page-container min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
            <div className="hero-glow" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-24">
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-4xl font-black premium-gradient-text uppercase italic tracking-tighter leading-tight">
                        Free-Play Arcade
                    </h1>
                    <p className="text-xs md:text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                        {ARCADE_GAMES.length} single-player games · no sign-up · {STARTING_BALANCE.toLocaleString()} free chips, refill any time
                    </p>
                </motion.div>

                <ArcadeStats />

                <div className="landing-toolbar">
                    <div className="landing-search">
                        <Search size={16} className="landing-search-icon" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search games…"
                            className="landing-search-input"
                            aria-label="Search games"
                        />
                    </div>
                </div>

                <motion.div layout className="landing-games-grid">
                    {games.map((game, index) => (
                        <GameCard
                            key={game.title}
                            title={game.title}
                            description={game.description}
                            preview={game.preview}
                            badge={game.badge}
                            onClick={() => onPlay(game)}
                            delay={Math.min(index * 0.05, 0.3)}
                        />
                    ))}
                </motion.div>
                {games.length === 0 && (
                    <p className="text-sm font-medium py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                        Nothing matches “{query}”.
                    </p>
                )}

                <p className="arcade-disclaimer">
                    Play money only. Chips have no cash value and cannot be purchased, won or withdrawn.
                    No account needed: your chips and record are saved in this browser and stay until you clear its site data.
                </p>
            </div>
        </div>
    );
};

const ArcadeApp = () => (
    <ThemeProvider>
        <SoundProvider>
            <ArcadeWalletProvider>
                <HashRouter>
                    <div className="layout-container" style={{ backgroundColor: 'var(--bg-deep)', color: 'var(--text-light)' }}>
                        <ArcadeHeader />
                        <main className="layout-main-fill layout-main">
                            <div className="layout-content-wrapper">
                                <Routes>
                                    <Route path="/" element={<ArcadeHome />} />
                                    {Object.entries(GAME_COMPONENTS).map(([path, Game]) => (
                                        <Route key={path} path={path} element={<Game />} />
                                    ))}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </div>
                        </main>
                    </div>
                </HashRouter>
            </ArcadeWalletProvider>
        </SoundProvider>
    </ThemeProvider>
);

export default ArcadeApp;
