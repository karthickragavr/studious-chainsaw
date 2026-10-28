import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, BookOpen, ListOrdered, Lightbulb } from 'lucide-react';

const HowToPlay = ({ gameName, rules = [], steps = [], tips = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-16 right-4 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 group animate-glow"
                style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
                title="How to Play"
            >
                <HelpCircle className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="glass-panel max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative"
                            style={{ backgroundColor: 'var(--bg-deep)', opacity: 0.97 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>

                            {/* Title */}
                            <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text mb-6" style={{ backgroundImage: 'linear-gradient(to right, var(--text-heading-from), var(--text-heading-to))' }}>
                                How to Play {gameName}
                            </h2>

                            {/* Rules */}
                            {rules.length > 0 && (
                                <Section icon={<BookOpen size={18} />} title="Rules">
                                    <ul className="space-y-2">
                                        {rules.map((rule, i) => (
                                            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                                <span className="font-bold shrink-0" style={{ color: 'var(--accent-primary)' }}>•</span>
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}

                            {/* Steps */}
                            {steps.length > 0 && (
                                <Section icon={<ListOrdered size={18} />} title="How to Play">
                                    <ol className="space-y-2">
                                        {steps.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--accent-primary)' }}>
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </Section>
                            )}

                            {/* Tips */}
                            {tips.length > 0 && (
                                <Section icon={<Lightbulb size={18} />} title="Tips">
                                    <ul className="space-y-2">
                                        {tips.map((tip, i) => (
                                            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                                <span className="text-amber-400 shrink-0">💡</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const Section = ({ icon, title, children }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-light)' }}>{title}</h3>
        </div>
        {children}
    </div>
);

export default HowToPlay;
