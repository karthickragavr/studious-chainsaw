import React, { createContext, useContext, useState, useEffect } from 'react';
import { setMuted } from '../utils/sounds';

const SoundContext = createContext();

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('casino_sound_muted') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('casino_sound_muted', isMuted);
        setMuted(isMuted);
    }, [isMuted]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};
