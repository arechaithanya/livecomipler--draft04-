'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type StackFrame = {
    id: string;
    value: number | string;
    state?: 'default' | 'pushing' | 'popping' | 'top';
};

const FRAME_STYLES: Record<string, { bg: string; border: string; glow: string; text: string; label: string }> = {
    default: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8', label: '' },
    pushing: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 20px #00ff8866', text: '#00ff88', label: 'PUSH' },
    popping: { bg: 'linear-gradient(135deg,#300a0a,#4a1010)', border: '#ff4d4d', glow: '0 0 20px #ff4d4d66', text: '#ff4d4d', label: 'POP' },
    top: { bg: 'linear-gradient(135deg,#200840,#320d64)', border: '#bf5fff', glow: '0 0 20px #bf5fff66', text: '#bf5fff', label: 'TOP' },
};

const depthColors = ['#4d9fff', '#bf5fff', '#00ff88', '#ffd700', '#ff6b6b', '#00cfff', '#ff9a3c'];

export const StackVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state) || state.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1.5rem 1rem', gap: '1rem' }}>
            <div style={{
                background: 'linear-gradient(90deg,#ff6b6b,#4d9fff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Stack (LIFO) — {state.length} element{state.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                {/* Stack tower */}
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '4px',
                    minHeight: '200px', justifyContent: 'flex-end',
                }}>
                    {/* TOP arrow */}
                    <motion.div
                        animate={{ opacity: state.length > 0 ? 1 : 0 }}
                        style={{ fontSize: '0.65rem', color: '#bf5fff', fontWeight: 800, letterSpacing: '0.12em', marginBottom: '2px' }}
                    >
                        ▼ TOP
                    </motion.div>

                    {/* Stack container */}
                    <div style={{
                        border: '1px dashed #2a2f50', borderRadius: '8px',
                        padding: '8px', minWidth: '160px',
                        background: 'rgba(10,12,20,0.7)',
                        display: 'flex', flexDirection: 'column-reverse', gap: '4px',
                        minHeight: '180px', justifyContent: 'flex-start',
                    }}>
                        <AnimatePresence>
                            {state.map((item: any, idx: number) => {
                                const id = typeof item === 'object' ? item.id : `s${idx}`;
                                const val = typeof item === 'object' ? item.value : item;
                                const itemState: string = (typeof item === 'object' ? item.state : 'default') || 'default';
                                const s = FRAME_STYLES[itemState] || FRAME_STYLES.default;
                                const isLast = idx === state.length - 1;
                                const dc = depthColors[idx % depthColors.length];

                                return (
                                    <motion.div
                                        key={id}
                                        layout
                                        initial={{ opacity: 0, x: 60, scaleX: 0.6 }}
                                        animate={{ opacity: 1, x: 0, scaleX: 1, boxShadow: isLast ? s.glow : 'none' }}
                                        exit={{ opacity: 0, x: 60, scaleX: 0.6 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            border: `2px solid ${isLast ? s.border : '#2a2f50'}`,
                                            background: isLast ? s.bg : 'linear-gradient(135deg,#1a1d30,#22263c)',
                                            fontFamily: 'monospace',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {/* Depth color strip */}
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                                            background: dc, boxShadow: `0 0 6px ${dc}88`
                                        }} />

                                        <span style={{ marginLeft: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: isLast ? s.text : '#a8b2d8' }}>{val}</span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#4a5080' }}>idx {idx}</span>
                                            {isLast && s.label && (
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                                                    padding: '1px 5px', borderRadius: '4px',
                                                    background: `${s.border}22`, color: s.text,
                                                    border: `1px solid ${s.border}66`
                                                }}>{s.label}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* BOTTOM label */}
                    <div style={{ fontSize: '0.65rem', color: '#2a2f50', fontWeight: 800, letterSpacing: '0.1em', marginTop: '2px' }}>
                        ▀▀▀ BOTTOM ▀▀▀
                    </div>
                </div>

                {/* Depth scale */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px', alignSelf: 'flex-end', paddingBottom: '28px' }}>
                    {state.map((_: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: i * 0.04 }}
                            style={{
                                width: `${16 + i * 4}px`, height: '6px',
                                background: depthColors[i % depthColors.length],
                                borderRadius: '2px',
                                boxShadow: `0 0 6px ${depthColors[i % depthColors.length]}88`,
                                transformOrigin: 'left',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(FRAME_STYLES).filter(([, s]) => s.label).map(([key, s]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: s.text }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.border, boxShadow: s.glow || undefined }} />
                        {s.label}
                    </div>
                ))}
            </div>
        </div>
    );
};
