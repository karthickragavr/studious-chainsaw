import React from 'react';
import { motion } from 'framer-motion';

const Chip = ({ value, color, onClick, isSelected, scale = 1, id }) => {
    return (
        <motion.div
            id={id}
            whileHover={{ y: -5, scale: scale * 1.05 }}
            whileTap={{ scale: scale * 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: scale }}
            onClick={onClick}
            className={`chip-container ${isSelected ? 'chip-selected' : ''}`}
            style={{
                backgroundColor: color,
                background: `radial-gradient(circle at 30% 30%, ${color}, #000)`
            }}
        >
            <div className="chip-highlight"></div>
            <div className="chip-inner-ring">
                <span className="chip-value-text">${value}</span>
            </div>

            {/* Decorative Ridges */}
            {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                    key={deg}
                    className="chip-ridge"
                    style={{ transform: `rotate(${deg}deg) translateY(-50%)`, top: '50%', height: '2px', width: '100%', background: 'transparent', borderLeft: '4px solid rgba(255,255,255,0.2)', borderRight: '4px solid rgba(255,255,255,0.2)', left: 0 }}
                />
            ))}
        </motion.div>
    );
};

export default Chip;
