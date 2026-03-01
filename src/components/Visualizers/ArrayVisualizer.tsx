'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ArrayItemState = {
    id: string;
    value: number | string;
    state?: 'default' | 'active' | 'comparing' | 'swapping' | 'sorted';
};

const STATE_STYLES: Record<string, { bg: string; border: string; glow: string; textColor: string; label: string }> = {
    default: { bg: 'linear-gradient(160deg,#1e2235,#252840)', border: '#3a3f60', glow: 'none', textColor: '#a8b2d8', label: '' },
    active: { bg: 'linear-gradient(160deg,#0d3b26,#0c5535)', border: '#00ff88', glow: '0 0 18px #00ff8866', textColor: '#00ff88', label: 'ACTIVE' },
    comparing: { bg: 'linear-gradient(160deg,#3b2a00,#5a4200)', border: '#ffd700', glow: '0 0 18px #ffd70066', textColor: '#ffd700', label: 'CMP' },
    swapping: { bg: 'linear-gradient(160deg,#2a0040,#400060)', border: '#bf5fff', glow: '0 0 22px #bf5fff88', textColor: '#bf5fff', label: 'SWAP' },
    sorted: { bg: 'linear-gradient(160deg,#001f5b,#002f8a)', border: '#4d9fff', glow: '0 0 18px #4d9fff66', textColor: '#4d9fff', label: 'DONE' },
};

export const ArrayVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state)) return null;

    const maxVal = Math.max(...state.map((item: any) => {
        const v = typeof item === 'object' ? Number(item.value) : Number(item);
        return isNaN(v) ? 1 : v;
    }), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', padding: '1.5rem 1rem' }}>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    background: 'linear-gradient(90deg, #00ff88, #4d9fff)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
                }}>
                    Array — {state.length} elements
                </div>
            </div>

            {/* Bars + Index row */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap', minHeight: '140px', width: '100%' }}>
                <AnimatePresence>
                    {state.map((item: any, idx: number) => {
                        const id = typeof item === 'object' ? item.id : `idx-${idx}`;
                        const val = typeof item === 'object' ? item.value : item;
                        const itemState: string = (typeof item === 'object' ? item.state : 'default') || 'default';
                        const styles = STATE_STYLES[itemState] || STATE_STYLES.default;
                        const numVal = Number(val);
                        const barH = isNaN(numVal) ? 60 : Math.max(30, (numVal / maxVal) * 120);

                        return (
                            <motion.div
                                key={id}
                                layout
                                initial={{ opacity: 0, y: 40, scaleY: 0 }}
                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: idx * 0.04 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', transformOrigin: 'bottom' }}
                            >
                                {/* State label badge */}
                                <motion.div
                                    animate={{ opacity: styles.label ? 1 : 0, y: styles.label ? 0 : 6 }}
                                    style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', color: styles.textColor, height: '12px' }}
                                >
                                    {styles.label}
                                </motion.div>

                                {/* Bar */}
                                <motion.div
                                    animate={{
                                        height: barH,
                                        background: styles.bg,
                                        borderColor: styles.border,
                                        boxShadow: styles.glow,
                                        color: styles.textColor,
                                    }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                    style={{
                                        width: '44px',
                                        border: '2px solid',
                                        borderRadius: '6px 6px 0 0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.85rem',
                                        fontFamily: 'monospace',
                                        position: 'relative', overflow: 'hidden',
                                        cursor: 'default',
                                    }}
                                >
                                    {/* shimmer strip */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
                                        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
                                        animation: 'shimmer 2.5s infinite',
                                        pointerEvents: 'none'
                                    }} />
                                    {val}
                                </motion.div>

                                {/* Index */}
                                <div style={{ fontSize: '0.65rem', color: '#4a5080', fontFamily: 'monospace', fontWeight: 600 }}>{idx}</div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                {Object.entries(STATE_STYLES).filter(([, s]) => s.label).map(([key, s]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: s.textColor }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.border, boxShadow: s.glow }} />
                        {s.label}
                    </div>
                ))}
            </div>

            <style>{`@keyframes shimmer { 0%{left:-60%} 100%{left:130%} }`}</style>
        </div>
    );
};
