'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type CallStackFrame = {
    id: string;
    functionName: string;
    params: string;
    returnValue?: string;
    state?: 'active' | 'returning' | 'paused';
};

const FRAME_STYLES: Record<string, { bg: string; border: string; glow: string; text: string; badge: string }> = {
    active: { bg: 'linear-gradient(135deg,#0a2a50,#0d3a70)', border: '#4d9fff', glow: '0 0 20px #4d9fff66', text: '#4d9fff', badge: 'EXEC' },
    returning: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 20px #00ff8866', text: '#00ff88', badge: 'RET' },
    paused: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8', badge: 'WAIT' },
};

export const RecursionVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state) || state.length === 0) return null;

    const depthColors = [
        '#4d9fff', '#bf5fff', '#00ff88', '#ffd700', '#ff6b6b', '#00cfff', '#ff9a3c',
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1.5rem 1rem', gap: '1rem' }}>
            <div style={{
                background: 'linear-gradient(90deg, #ff6b6b, #ffd700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Call Stack — {state.length} frame{state.length !== 1 ? 's' : ''}
            </div>

            {/* Stack container — grows upware (visual stack) */}
            <div style={{
                position: 'relative',
                width: '100%', maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column-reverse',
                alignItems: 'center',
                gap: '6px',
                padding: '1.25rem 1rem',
                background: 'linear-gradient(180deg, rgba(10,12,20,0.9), rgba(20,24,38,0.7))',
                border: '1px dashed #2a2f50',
                borderRadius: '12px',
                minHeight: '240px',
                overflowY: 'auto',
                maxHeight: '400px',
            }}>
                {/* Stack bottom label */}
                <div style={{
                    position: 'absolute', bottom: '6px',
                    fontSize: '0.6rem', letterSpacing: '0.12em', color: '#2a2f50',
                    fontFamily: 'monospace', fontWeight: 800
                }}>▀▀▀ STACK BASE ▀▀▀</div>

                <AnimatePresence>
                    {state.map((frame: any, idx: number) => {
                        const s = FRAME_STYLES[frame.state || 'paused'] || FRAME_STYLES.paused;
                        const depthColor = depthColors[idx % depthColors.length];
                        const isTop = idx === state.length - 1;

                        return (
                            <motion.div
                                key={frame.id}
                                layout
                                initial={{ opacity: 0, x: 60, scale: 0.85 }}
                                animate={{ opacity: 1, x: 0, scale: isTop ? 1.03 : 1 }}
                                exit={{ opacity: 0, x: -60, scale: 0.85 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                style={{
                                    width: '100%',
                                    padding: '0.65rem 1rem',
                                    borderRadius: '8px',
                                    border: `2px solid ${s.border}`,
                                    background: s.bg,
                                    boxShadow: s.glow || '0 2px 8px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontFamily: 'monospace',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Depth strip on left */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                    background: depthColor,
                                    boxShadow: `0 0 10px ${depthColor}88`
                                }} />

                                {/* Content */}
                                <div style={{ marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.text }}>
                                        {frame.functionName}
                                        <span style={{ color: '#4a5080' }}>(</span>
                                        <span style={{ color: '#ffd700' }}>{frame.params}</span>
                                        <span style={{ color: '#4a5080' }}>)</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#4a5080' }}>depth {idx}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {frame.returnValue && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                padding: '0.2rem 0.6rem',
                                                background: 'rgba(0,255,136,0.1)',
                                                border: '1px solid #00ff8866',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                color: '#00ff88',
                                            }}
                                        >
                                            ↩ {frame.returnValue}
                                        </motion.div>
                                    )}

                                    {/* State badge */}
                                    <div style={{
                                        fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                                        background: `${s.border}22`, color: s.text,
                                        border: `1px solid ${s.border}66`,
                                    }}>{s.badge}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Depth meter */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.78rem', color: '#4a5080' }}>
                <span>Depth:</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {state.map((_: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                width: '8px', height: '18px',
                                background: depthColors[i % depthColors.length],
                                borderRadius: '2px',
                                boxShadow: `0 0 6px ${depthColors[i % depthColors.length]}88`,
                                transformOrigin: 'bottom',
                            }}
                        />
                    ))}
                </div>
                <span style={{ color: '#bf5fff', fontWeight: 800 }}>{state.length}</span>
            </div>
        </div>
    );
};
