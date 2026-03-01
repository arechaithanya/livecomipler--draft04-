'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrayVisualizer } from './ArrayVisualizer';
import { LinkedListVisualizer } from './LinkedListVisualizer';
import { TreeVisualizer } from './TreeVisualizer';
import { GraphVisualizer } from './GraphVisualizer';
import { RecursionVisualizer } from './RecursionVisualizer';
import { StackVisualizer } from './StackVisualizer';
import { QueueVisualizer } from './QueueVisualizer';

export type VisualizerFrame = {
    state: any;
    description: string;
    activeLines?: number[];
};

type VisualizerControllerProps = {
    frames: VisualizerFrame[];
    type: 'array' | 'linkedlist' | 'tree' | 'graph' | 'recursion' | 'stack' | 'queue';
};

const TYPE_META: Record<string, { label: string; color: string; glow: string; icon: string }> = {
    array: { label: 'Array', color: '#00ff88', glow: '#00ff8844', icon: '▦' },
    linkedlist: { label: 'Linked List', color: '#bf5fff', glow: '#bf5fff44', icon: '◈' },
    tree: { label: 'Tree', color: '#ffd700', glow: '#ffd70044', icon: '⬡' },
    graph: { label: 'Graph', color: '#00cfff', glow: '#00cfff44', icon: '◎' },
    recursion: { label: 'Recursion', color: '#ff6b6b', glow: '#ff6b6b44', icon: 'ƒ' },
    stack: { label: 'Stack', color: '#4d9fff', glow: '#4d9fff44', icon: '⬆' },
    queue: { label: 'Queue', color: '#00cfff', glow: '#00cfff44', icon: '↔' },
};

export const VisualizerController = ({ frames, type }: VisualizerControllerProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMs, setSpeedMs] = useState(1000);
    const scrollRef = useRef<HTMLDivElement>(null);

    const meta = TYPE_META[type] || TYPE_META.array;
    const progress = frames.length > 1 ? (currentStep / (frames.length - 1)) * 100 : 100;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && currentStep < frames.length - 1) {
            interval = setInterval(() => setCurrentStep(p => p + 1), speedMs);
        } else if (currentStep >= frames.length - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, frames.length, speedMs]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentStep]);

    // Reset to step 0 when frames change (new code run)
    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [frames]);

    const handlePlayPause = () => setIsPlaying(p => !p);
    const handleNext = () => setCurrentStep(p => Math.min(frames.length - 1, p + 1));
    const handleReset = () => { setIsPlaying(false); setCurrentStep(0); };

    if (!frames || frames.length === 0) return null;

    const frame = frames[currentStep];

    const renderVisualizer = () => {
        switch (type) {
            case 'array': return <ArrayVisualizer state={frame.state} />;
            case 'linkedlist': return <LinkedListVisualizer state={frame.state} />;
            case 'tree': return <TreeVisualizer state={frame.state} />;
            case 'graph': return <GraphVisualizer state={frame.state} />;
            case 'recursion': return <RecursionVisualizer state={frame.state} />;
            case 'stack': return <StackVisualizer state={frame.state} />;
            case 'queue': return <QueueVisualizer state={frame.state} />;
            default: return <div style={{ color: '#4a5080', textAlign: 'center', padding: '2rem' }}>Unsupported type</div>;
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 0, height: '100%',
            background: 'linear-gradient(180deg, #0c0e1a 0%, #10131f 100%)',
            borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${meta.color}33`,
            boxShadow: `0 0 40px ${meta.glow}, 0 4px 20px rgba(0,0,0,0.6)`,
        }}>

            {/* ── Header ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                background: `linear-gradient(90deg, ${meta.glow}, transparent)`,
                borderBottom: `1px solid ${meta.color}33`,
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem', color: meta.color }}>{meta.icon}</span>
                    <span style={{
                        fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: meta.color,
                    }}>{meta.label} Visualization</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4a5080', fontFamily: 'monospace' }}>
                    {currentStep + 1} / {frames.length}
                </div>
            </div>

            {/* ── Progress Bar ── */}
            <div style={{ height: '3px', background: '#1a1d30', position: 'relative', flexShrink: 0 }}>
                <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 28 }}
                    style={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`,
                        boxShadow: `0 0 12px ${meta.color}`,
                    }}
                />
            </div>

            {/* ── Visual Stage (scrollable) ── */}
            <div style={{
                flex: 1, minHeight: 0,
                overflowY: 'auto', overflowX: 'hidden',
                scrollbarWidth: 'thin', scrollbarColor: `${meta.color}44 transparent`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${type}-${currentStep}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.22 }}
                        style={{ width: '100%' }}
                    >
                        {renderVisualizer()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Step Description ── */}
            <div
                ref={scrollRef}
                style={{
                    flexShrink: 0,
                    margin: '0 1rem 0.75rem',
                    padding: '0.65rem 1rem',
                    background: `linear-gradient(135deg, ${meta.glow}, rgba(10,12,20,0.8))`,
                    borderRadius: '8px',
                    borderLeft: `3px solid ${meta.color}`,
                    boxShadow: `0 0 14px ${meta.glow}`,
                }}
            >
                <div style={{ fontSize: '0.7rem', color: meta.color, fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
                    STEP {currentStep + 1}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#c8d0f0', lineHeight: 1.5 }}>
                    {frame.description}
                </div>
            </div>

            {/* ── Controls ── */}
            <div style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                background: '#0a0c18',
                borderTop: `1px solid ${meta.color}22`,
                gap: '1rem',
            }}>
                {/* Playback */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                        onClick={handlePlayPause}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}22)`,
                            border: `2px solid ${meta.color}`,
                            color: meta.color, cursor: 'pointer',
                            boxShadow: `0 0 14px ${meta.glow}`,
                        }}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                        onClick={handleNext}
                        disabled={currentStep >= frames.length - 1}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: '#1a1d30', border: '1px solid #3a3f60',
                            color: currentStep >= frames.length - 1 ? '#3a3f60' : '#a8b2d8',
                            cursor: currentStep >= frames.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: currentStep >= frames.length - 1 ? 0.4 : 1,
                        }}
                    >
                        <SkipForward size={15} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                        onClick={handleReset}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: '#1a1d30', border: '1px solid #3a3f60',
                            color: '#a8b2d8', cursor: 'pointer',
                        }}
                    >
                        <RotateCcw size={15} />
                    </motion.button>
                </div>

                {/* Step dots */}
                <div style={{
                    flex: 1, display: 'flex', gap: '4px', justifyContent: 'center',
                    alignItems: 'center', overflow: 'hidden',
                }}>
                    {frames.slice(0, Math.min(frames.length, 20)).map((_, i) => (
                        <motion.div
                            key={i}
                            onClick={() => { setIsPlaying(false); setCurrentStep(i); }}
                            animate={{
                                width: i === currentStep ? 16 : 6,
                                background: i === currentStep ? meta.color : i < currentStep ? `${meta.color}66` : '#2a2f50',
                                boxShadow: i === currentStep ? `0 0 8px ${meta.color}` : 'none',
                            }}
                            style={{ height: '6px', borderRadius: '3px', cursor: 'pointer', flexShrink: 0 }}
                        />
                    ))}
                    {frames.length > 20 && <span style={{ fontSize: '0.65rem', color: '#4a5080' }}>+{frames.length - 20}</span>}
                </div>

                {/* Speed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5080', fontSize: '0.75rem' }}>
                    <Zap size={13} style={{ color: meta.color }} />
                    <input
                        type="range" min={200} max={2000} step={100}
                        value={2200 - speedMs}
                        onChange={e => setSpeedMs(2200 - parseInt(e.target.value))}
                        style={{ cursor: 'pointer', width: '70px', accentColor: meta.color }}
                    />
                </div>
            </div>
        </div>
    );
};
