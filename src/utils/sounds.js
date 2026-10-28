const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = localStorage.getItem('casino_sound_muted') === 'true';

export const setMuted = (muted) => {
    isMuted = muted;
};

const playSound = (setupFn) => {
    if (isMuted) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    setupFn();
};

export const playCardSnap = () => {
    playSound(() => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    });
};

export const playChipClick = () => {
    playSound(() => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    });
};

export const playWinJingle = () => {
    playSound(() => {
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
            g.gain.setValueAtTime(0.04, audioCtx.currentTime + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.2);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.1);
            osc.stop(audioCtx.currentTime + i * 0.1 + 0.2);
        });
    });
};

export const playLossStinger = () => {
    playSound(() => {
        [220, 185, 165].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
            g.gain.setValueAtTime(0.05, audioCtx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.3);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.15);
            osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
        });
    });
};

export const playRouletteClick = () => {
    playSound(() => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.03);
        g.gain.setValueAtTime(0.05, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    });
};

export const playSlotSpin = () => {
    playSound(() => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        g.gain.setValueAtTime(0.02, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.2);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    });
};

export const playShuffle = () => {
    playSound(() => {
        for (let i = 0; i < 5; i++) {
            const time = audioCtx.currentTime + i * 0.05;
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(100 + i * 20, time);
            g.gain.setValueAtTime(0.03, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + 0.04);
        }
    });
};

export const playCoinSound = () => {
    playSound(() => {
        const t = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Classic 8-bit coin sound uses a square wave
        oscillator.type = 'square';

        // B5 (approx 988Hz) -> E6 (approx 1319Hz)
        // The jump happens very quickly
        oscillator.frequency.setValueAtTime(988, t);
        oscillator.frequency.setValueAtTime(1319, t + 0.08);

        // Volume envelope
        gainNode.gain.setValueAtTime(0.04, t);
        gainNode.gain.linearRampToValueAtTime(0.04, t + 0.08);
        gainNode.gain.setValueAtTime(0.04, t + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(t);
        oscillator.stop(t + 0.5);
    });
};
export const playNotificationSound = () => {
    playSound(() => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    });
};
