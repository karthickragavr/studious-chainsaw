import React from 'react';
import { motion } from 'framer-motion';
import { playChipClick } from '../utils/sounds';

/**
 * Standard chip value presets used across all games.
 * Each game can pick one of these presets so chip values stay consistent.
 */
export const CHIP_PRESETS = {
    /** High-stakes table games: Baccarat, Blackjack, Mangatha, Rummy */
    high: [
        { value: 50, color: '#ef4444' },
        { value: 100, color: '#6366f1' },
        { value: 500, color: '#10b981' },
        { value: 1000, color: '#8b5cf6' },
    ],
    /** Medium-stakes games: Poker, Roulette */
    medium: [
        { value: 10, color: '#ef4444' },
        { value: 25, color: '#3b82f6' },
        { value: 50, color: '#10b981' },
        { value: 100, color: '#8b5cf6' },
    ],
    /** Low-stakes games: Slots */
    low: [
        { value: 1, color: '#94a3b8' },
        { value: 2, color: '#3b82f6' },
        { value: 5, color: '#ef4444' },
        { value: 10, color: '#eab308' },
    ],
};

/**
 * Flat list of all possible chip definitions for external reference.
 */
export const ALL_CHIP_VALUES = [
    { value: 1, color: '#94a3b8' },
    { value: 2, color: '#3b82f6' },
    { value: 5, color: '#ef4444' },
    { value: 10, color: '#ef4444' },
    { value: 25, color: '#3b82f6' },
    { value: 50, color: '#10b981' },
    { value: 100, color: '#8b5cf6' },
    { value: 500, color: '#10b981' },
    { value: 1000, color: '#8b5cf6' },
];

/**
 * A single chip element. Used both inside ChipSelector and standalone
 * (e.g. Mangatha places a chip on the bet panel).
 */
export const ChipToken = ({ value, color, isSelected, onClick, disabled, scale = 1, id }) => {
    return (
        <motion.div
            id={id}
            whileHover={disabled ? {} : { y: -10, scale: scale * 1.1 }}
            whileTap={disabled ? {} : { scale: scale * 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale }}
            onClick={disabled ? undefined : onClick}
            className={`chip-container ${isSelected ? 'chip-selected' : ''} ${disabled ? 'chip-disabled' : ''}`}
            style={{
                backgroundColor: color,
                background: `radial-gradient(circle at center, ${color} 0%, rgba(0,0,0,0.3) 100%)`,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <div className="chip-inner-ring">
                <span className="chip-value-text text-xs md:text-sm font-black">${value}</span>
            </div>

            {/* Decorative Ridges */}
            {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                    key={deg}
                    className="chip-ridge"
                    style={{ transform: `rotate(${deg}deg) translateY(-26px)` }}
                />
            ))}
        </motion.div>
    );
};

/**
 * ChipSelector -- the unified chip picker row used in the betting phase of every game.
 *
 * Props:
 *   - preset        'high' | 'medium' | 'low' -- picks from CHIP_PRESETS (default: 'high')
 *   - chips         Custom chip array [{value, color}] -- overrides preset
 *   - selectedChip  Currently selected chip value
 *   - onSelectChip  Callback(value) when a chip is clicked
 *   - disabled      If true, all chips are non-interactive
 *   - idPrefix      Prefix for test IDs (e.g. 'baccarat' -> id="baccarat-chip-50")
 *   - className     Additional CSS class for the wrapper
 */
const ChipSelector = ({
    preset = 'high',
    chips,
    selectedChip,
    onSelectChip,
    disabled = false,
    idPrefix = '',
    className = '',
    chipScale = 1,
}) => {
    const chipSet = chips || CHIP_PRESETS[preset] || CHIP_PRESETS.high;

    const handleClick = (value) => {
        if (disabled) return;
        playChipClick();
        onSelectChip(value);
    };

    return (
        <div className={`chip-selector-row ${className}`}>
            {chipSet.map(({ value, color }) => (
                <ChipToken
                    key={value}
                    id={idPrefix ? `${idPrefix}-chip-${value}` : undefined}
                    value={value}
                    color={color}
                    isSelected={selectedChip === value}
                    onClick={() => handleClick(value)}
                    disabled={disabled}
                    scale={chipScale}
                />
            ))}
        </div>
    );
};

export default ChipSelector;
