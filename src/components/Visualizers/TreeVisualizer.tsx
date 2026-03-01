'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TreeNodeState = {
    id: string;
    value: string | number;
    pos: 'root' | 'L' | 'R' | 'LL' | 'LR' | 'RL' | 'RR';
    parentPos?: string;
    state?: 'default' | 'active' | 'found' | 'inserting';
};

const TREE_COORDS: Record<string, { x: string; y: string }> = {
    root: { x: '50%', y: '12%' },
    L: { x: '25%', y: '42%' },
    R: { x: '75%', y: '42%' },
    LL: { x: '12.5%', y: '76%' },
    LR: { x: '37.5%', y: '76%' },
    RL: { x: '62.5%', y: '76%' },
    RR: { x: '87.5%', y: '76%' },
};

const NODE_STYLES: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    default: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8' },
    active: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 22px #00ff8888', text: '#00ff88' },
    found: { bg: 'linear-gradient(135deg,#200840,#320d64)', border: '#bf5fff', glow: '0 0 22px #bf5fff88', text: '#bf5fff' },
    inserting: { bg: 'linear-gradient(135deg,#2a2000,#3d2e00)', border: '#ffd700', glow: '0 0 22px #ffd70088', text: '#ffd700' },
};

const EDGE_COLORS: Record<string, string> = {
    default: '#3a3f60',
    active: '#00ff88',
    found: '#bf5fff',
    inserting: '#ffd700',
};

export const TreeVisualizer = ({ state }: { state: any }) => {
    if (!state || !Array.isArray(state) || state.length === 0) return null;

    // Build a map for quick node lookup
    const nodeMap: Record<string, any> = {};
    state.forEach((n: any) => { nodeMap[n.pos] = n; });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1.5rem 1rem', gap: '1rem' }}>
            <div style={{
                background: 'linear-gradient(90deg, #ffd700, #ff6b6b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Binary Tree Traversal
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '640px', minHeight: '280px' }}>
                {/* SVG Edge Layer */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'visible' }}>
                    <defs>
                        {['active', 'found', 'inserting'].map(s => (
                            <filter key={s} id={`glow-edge-${s}`}>
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        ))}
                    </defs>

                    {state.map((node: any) => {
                        if (!node.parentPos || !TREE_COORDS[node.pos] || !TREE_COORDS[node.parentPos]) return null;
                        const childCoords = TREE_COORDS[node.pos];
                        const parentCoords = TREE_COORDS[node.parentPos];
                        const edgeColor = EDGE_COLORS[node.state || 'default'] || EDGE_COLORS.default;
                        const isSpecial = node.state && node.state !== 'default';

                        return (
                            <motion.line
                                key={`edge-${node.id}`}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1, stroke: edgeColor }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                x1={parentCoords.x} y1={parentCoords.y}
                                x2={childCoords.x} y2={childCoords.y}
                                strokeWidth={isSpecial ? 3 : 2}
                                filter={isSpecial ? `url(#glow-edge-${node.state})` : undefined}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>

                {/* Node Layer */}
                <AnimatePresence>
                    {state.map((node: any) => {
                        const coords = TREE_COORDS[node.pos];
                        if (!coords) return null;
                        const styles = NODE_STYLES[node.state || 'default'] || NODE_STYLES.default;
                        const isRoot = node.pos === 'root';

                        return (
                            <motion.div
                                key={node.id}
                                layoutId={`tree-node-${node.id}`}
                                initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                animate={{
                                    opacity: 1,
                                    scale: isRoot ? 1.15 : 1,
                                    rotate: 0,
                                    background: styles.bg,
                                    borderColor: styles.border,
                                    boxShadow: styles.glow,
                                    color: styles.text,
                                }}
                                exit={{ opacity: 0, scale: 0, rotate: 30 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                style={{
                                    position: 'absolute',
                                    left: coords.x,
                                    top: coords.y,
                                    x: '-50%',
                                    y: '-50%',
                                    width: isRoot ? '50px' : '44px',
                                    height: isRoot ? '50px' : '44px',
                                    borderRadius: '50%',
                                    border: '2.5px solid',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.9rem',
                                    zIndex: 2,
                                    fontFamily: 'monospace',
                                    cursor: 'default',
                                }}
                            >
                                {node.value}
                                {isRoot && (
                                    <div style={{
                                        position: 'absolute', top: '-20px', fontSize: '0.58rem',
                                        fontWeight: 800, letterSpacing: '0.1em', color: styles.text
                                    }}>ROOT</div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
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
        </div>
    );
};
