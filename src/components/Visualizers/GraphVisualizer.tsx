'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GraphNodeState = {
    id: string;
    value: string | number;
    state?: 'default' | 'active' | 'visited' | 'exploring';
};

export type GraphEdgeState = {
    source: string;
    target: string;
    state?: 'default' | 'active' | 'visited';
};

const GRAPH_COORDS: Record<string, { x: string; y: string }> = {
    A: { x: '50%', y: '12%' },
    B: { x: '85%', y: '38%' },
    C: { x: '72%', y: '82%' },
    D: { x: '28%', y: '82%' },
    E: { x: '15%', y: '38%' },
};

const NODE_STYLES: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    default: { bg: 'linear-gradient(135deg,#1a1d30,#22263c)', border: '#3a3f60', glow: 'none', text: '#a8b2d8' },
    active: { bg: 'linear-gradient(135deg,#0a3020,#0d4a2e)', border: '#00ff88', glow: '0 0 24px #00ff8899', text: '#00ff88' },
    visited: { bg: 'linear-gradient(135deg,#200840,#320d64)', border: '#bf5fff', glow: '0 0 24px #bf5fff99', text: '#bf5fff' },
    exploring: { bg: 'linear-gradient(135deg,#2a2000,#3d2e00)', border: '#ffd700', glow: '0 0 24px #ffd70099', text: '#ffd700' },
};

const EDGE_STYLES: Record<string, { color: string; width: number }> = {
    default: { color: '#3a3f60', width: 2 },
    active: { color: '#00ff88', width: 3 },
    visited: { color: '#bf5fff', width: 3 },
};

export const GraphVisualizer = ({ state }: { state: any }) => {
    if (!state || !state.nodes || !Array.isArray(state.nodes)) return null;

    const { nodes = [], edges = [] } = state;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1.5rem 1rem', gap: '1rem' }}>
            <div style={{
                background: 'linear-gradient(90deg, #00cfff, #bf5fff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
                Graph — DFS / BFS Traversal
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '580px', minHeight: '300px' }}>
                {/* SVG Edges */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'visible' }}>
                    <defs>
                        <filter id="edge-glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {edges.map((edge: any, idx: number) => {
                        const src = GRAPH_COORDS[edge.source];
                        const tgt = GRAPH_COORDS[edge.target];
                        if (!src || !tgt) return null;
                        const es = EDGE_STYLES[edge.state || 'default'] || EDGE_STYLES.default;

                        return (
                            <motion.line
                                key={`edge-${edge.source}-${edge.target}-${idx}`}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1, stroke: es.color }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                x1={src.x} y1={src.y}
                                x2={tgt.x} y2={tgt.y}
                                strokeWidth={es.width}
                                filter={edge.state && edge.state !== 'default' ? 'url(#edge-glow)' : undefined}
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                <AnimatePresence>
                    {nodes.map((node: any) => {
                        const coords = GRAPH_COORDS[node.id];
                        if (!coords) return null;
                        const styles = NODE_STYLES[node.state || 'default'] || NODE_STYLES.default;

                        return (
                            <motion.div
                                key={node.id}
                                layoutId={`graph-node-${node.id}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 1, scale: 1,
                                    background: styles.bg,
                                    borderColor: styles.border,
                                    boxShadow: styles.glow,
                                    color: styles.text,
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                                style={{
                                    position: 'absolute',
                                    left: coords.x, top: coords.y,
                                    x: '-50%', y: '-50%',
                                    width: '50px', height: '50px',
                                    borderRadius: '50%',
                                    border: '2.5px solid',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '1rem',
                                    fontFamily: 'monospace',
                                    zIndex: 2, cursor: 'default',
                                }}
                            >
                                {node.value}
                                {/* Node ID label */}
                                <div style={{
                                    position: 'absolute', bottom: '-18px',
                                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                                    color: '#4a5080'
                                }}>{node.id}</div>
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
