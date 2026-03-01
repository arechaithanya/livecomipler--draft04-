'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type QueueItem = {
    id: string;
    value: number | string;
    state?: 'default' | 'enqueuing' | 'dequeuing' | 'front';
};

const ITEM_STYLES: Record<string, { bg: string; border: string; glow: string; text: string; label: string }> = {
    default: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8', label: '' },
    enqueuing: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 20px #00ff8866', text: '#00ff88', label: 'ENQ' },
    dequeuing: { bg: 'linear-gradient(135deg,#300a0a,#4a1010)', border: '#ff4d4d', glow: '0 0 20px #ff4d4d66', text: '#ff4d4d', label: 'DEQ' },
    front: { bg: 'linear-gradient(135deg,#200840,#320d64)', border: '#bf5fff', glow: '0 0 20px #bf5fff66', text: '#bf5fff', label: 'FRONT' },
};

export const QueueVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state) || state.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1.5rem 1rem', gap: '1.5rem' }}>
            <div style={{
                background: 'linear-gradient(90deg,#00cfff,#00ff88)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Queue (FIFO) — {state.length} element{state.length !== 1 ? 's' : ''}
            </div>

            {/* FIFO labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', padding: '0 0.5rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#ff4d4d', fontWeight: 800, letterSpacing: '0.12em' }}>⬅ DEQUEUE (FRONT)</div>
                <div style={{ fontSize: '0.65rem', color: '#00ff88', fontWeight: 800, letterSpacing: '0.12em' }}>ENQUEUE (REAR) ➡</div>
            </div>

            {/* Queue channel */}
            <div style={{
                width: '100%', maxWidth: '640px',
                overflowX: 'auto', paddingBottom: '0.75rem',
                scrollbarWidth: 'thin', scrollbarColor: '#3a3f60 transparent'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '1rem 1.5rem',
                    background: 'rgba(10,12,20,0.7)',
                    border: '1px dashed #2a2f50',
                    borderRadius: '12px',
                    minWidth: 'max-content',
                    minHeight: '80px',
                    position: 'relative',
                }}>
                    <AnimatePresence mode="popLayout">
                        {state.map((item: any, idx: number) => {
                            const id = typeof item === 'object' ? item.id : `q${idx}`;
                            const val = typeof item === 'object' ? item.value : item;
                            const itemState: string = (typeof item === 'object' ? item.state : 'default') || 'default';
                            const isFront = idx === 0;
                            const isRear = idx === state.length - 1;
                            const s = ITEM_STYLES[itemState] || ITEM_STYLES.default;

                            return (
                                <motion.div
                                    key={id}
                                    layout
                                    initial={{ opacity: 0, x: 60, scale: 0.7 }}
                                    animate={{ opacity: 1, x: 0, scale: 1, boxShadow: s.glow || undefined }}
                                    exit={{ opacity: 0, x: -60, scale: 0.7 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    {/* Position label */}
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', color: isFront ? '#bf5fff' : isRear ? '#00ff88' : '#4a5080' }}>
                                        {isFront ? '⬅ FRONT' : isRear ? 'REAR ➡' : `[${idx}]`}
                                    </div>

                                    {/* Cell */}
                                    <motion.div
                                        animate={{ background: s.bg, borderColor: s.border, color: s.text }}
                                        style={{
                                            width: '56px', height: '56px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '8px', border: '2px solid',
                                            fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {/* Shimmer */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
                                            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)',
                                            animation: 'qshimmer 2.5s infinite', pointerEvents: 'none'
                                        }} />
                                        {val}
                                    </motion.div>

                                    {/* State badge */}
                                    {s.label && (
                                        <div style={{
                                            fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                                            padding: '1px 5px', borderRadius: '4px',
                                            background: `${s.border}22`, color: s.text,
                                            border: `1px solid ${s.border}66`
                                        }}>{s.label}</div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Size meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#4a5080' }}>Size:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {state.map((_: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                width: '10px', height: '18px',
                                background: i === 0 ? '#bf5fff' : i === state.length - 1 ? '#00ff88' : '#4d9fff',
                                borderRadius: '2px',
                                boxShadow: i === 0 ? '0 0 6px #bf5fff88' : i === state.length - 1 ? '0 0 6px #00ff8888' : 'none',
                                transformOrigin: 'bottom',
                            }}
                        />
                    ))}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#00cfff', fontWeight: 800 }}>{state.length}</span>
            </div>

            <style>{`@keyframes qshimmer { 0%{left:-60%} 100%{left:130%} }`}</style>
        </div>
    );
};
