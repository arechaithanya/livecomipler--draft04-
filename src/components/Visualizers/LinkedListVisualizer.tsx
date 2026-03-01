'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type LinkedListNodeState = {
    id: string;
    value: number | string;
    state?: 'default' | 'active' | 'creating' | 'deleting' | 'found';
    next?: string | null;
};

const NODE_STYLES: Record<string, { bg: string; border: string; glow: string; text: string; dot: string }> = {
    default: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8', dot: '#3a3f60' },
    active: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 20px #00ff8866', text: '#00ff88', dot: '#00ff88' },
    found: { bg: 'linear-gradient(135deg,#200840,#320d64)', border: '#bf5fff', glow: '0 0 20px #bf5fff66', text: '#bf5fff', dot: '#bf5fff' },
    creating: { bg: 'linear-gradient(135deg,#2a2000,#3d2e00)', border: '#ffd700', glow: '0 0 18px #ffd70066', text: '#ffd700', dot: '#ffd700' },
    deleting: { bg: 'linear-gradient(135deg,#300a0a,#4a1010)', border: '#ff4d4d', glow: '0 0 18px #ff4d4d66', text: '#ff4d4d', dot: '#ff4d4d' },
};

export const LinkedListVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state) || state.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', padding: '1.5rem 1rem' }}>
            <div style={{
                background: 'linear-gradient(90deg, #bf5fff, #4d9fff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Linked List — {state.length} nodes
            </div>

            {/* Scrollable horizontal container */}
            <div style={{
                width: '100%', overflowX: 'auto', paddingBottom: '1rem',
                scrollbarWidth: 'thin', scrollbarColor: '#3a3f60 transparent'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', padding: '1.5rem 1rem', gap: 0 }}>
                    <AnimatePresence mode="popLayout">
                        {state.map((node: any, idx: number) => {
                            const id = typeof node === 'object' ? node.id : `node-${idx}`;
                            const val = typeof node === 'object' ? node.value : node;
                            const itemState: string = (typeof node === 'object' ? node.state : 'default') || 'default';
                            const styles = NODE_STYLES[itemState] || NODE_STYLES.default;
                            const isLast = idx === state.length - 1;

                            return (
                                <motion.div
                                    layout
                                    key={id}
                                    initial={{ opacity: 0, scale: 0.5, y: -24 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0, y: 24 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    {/* Node */}
                                    <motion.div
                                        animate={{ boxShadow: styles.glow }}
                                        style={{
                                            display: 'flex',
                                            border: `2px solid ${styles.border}`,
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            height: '52px',
                                            background: styles.bg,
                                            fontFamily: 'monospace',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Shimmer */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
                                            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)',
                                            animation: 'llshimmer 2.5s infinite', pointerEvents: 'none'
                                        }} />

                                        {/* Head label */}
                                        {idx === 0 && (
                                            <div style={{
                                                position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                                                fontSize: '0.6rem', fontWeight: 800, color: styles.text, letterSpacing: '0.1em'
                                            }}>HEAD</div>
                                        )}

                                        {/* Data cell */}
                                        <div style={{
                                            padding: '0 1.2rem', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontWeight: 700, color: styles.text,
                                            fontSize: '1rem', borderRight: `1px solid ${styles.border}`,
                                            minWidth: '52px',
                                        }}>
                                            {val}
                                        </div>

                                        {/* Pointer cell */}
                                        <div style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <motion.div
                                                animate={{ backgroundColor: styles.dot, boxShadow: styles.glow }}
                                                style={{ width: '8px', height: '8px', borderRadius: '50%' }}
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Arrow / NULL */}
                                    {!isLast ? (
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 0 }}
                                            animate={{ scaleX: 1, opacity: 1 }}
                                            style={{ display: 'flex', alignItems: 'center', width: '48px', transformOrigin: 'left' }}
                                        >
                                            <div style={{ height: '2px', flex: 1, background: `linear-gradient(90deg, ${styles.border}, #3a3f60)` }} />
                                            <div style={{
                                                borderTop: '5px solid transparent',
                                                borderBottom: '5px solid transparent',
                                                borderLeft: `8px solid #3a3f60`
                                            }} />
                                        </motion.div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', gap: '4px' }}>
                                            <div style={{ width: '20px', height: '2px', background: '#3a3f60' }} />
                                            <div style={{
                                                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
                                                color: '#ff4d4d', fontFamily: 'monospace',
                                                border: '1px solid #ff4d4d44', padding: '2px 6px', borderRadius: '4px',
                                                boxShadow: '0 0 8px #ff4d4d33'
                                            }}>NULL</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(NODE_STYLES).map(([key, s]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: s.text }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.border, boxShadow: s.glow || undefined }} />
                        {key}
                    </div>
                ))}
            </div>

            <style>{`@keyframes llshimmer { 0%{left:-60%} 100%{left:130%} }`}</style>
        </div>
    );
};
