"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Code2, Terminal, Cpu, Database, Settings, AlertTriangle, Lightbulb, Zap, Activity } from 'lucide-react';
import styles from './page.module.css';
import { VisualizerController } from '@/components/Visualizers/VisualizerController';
import { logErrorEvent } from '@/lib/analytics';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex-center" style={{ height: '100%' }}>Loading Editor...</div>,
});

const BOILERPLATES: Record<string, string> = {
  javascript: "// Write your JavaScript code here...\nfunction compute() {\n  for(let i=0; i<10; i++) {\n    console.log(i);\n  }\n}\ncompute();",
  cpp: "// Write your C++ code here...\n#include <iostream>\n\nint main() {\n    for(int i=0; i<10; i++) {\n        std::cout << i << std::endl;\n    }\n    return 0;\n}",
  java: "// Write your Java code here...\npublic class Main {\n    public static void main(String[] args) {\n        for(int i=0; i<10; i++) {\n            System.out.println(i);\n        }\n    }\n}",
  python: "# Write your Python code here...\ndef compute():\n    for i in range(10):\n        print(i)\n\ncompute()",
  rust: "// Write your Rust code here...\nfn main() {\n    for i in 0..10 {\n        println!(\"{}\", i);\n    }\n}",
  go: "// Write your Go code here...\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    for i := 0; i < 10; i++ {\n        fmt.Println(i)\n    }\n}"
};

export default function IDEPage() {
  const [language, setLanguage] = useState("javascript");
  const [langCode, setLangCode] = useState<Record<string, string>>(BOILERPLATES);
  const code = langCode[language];
  const setCode = (val: string) => setLangCode((prev) => ({ ...prev, [language]: val }));

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("Output will appear here...");
  const [isExecuting, setIsExecuting] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchAIInsight = async (type: string, errorMsg?: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, type, errorMsg })
      });
      const data = await res.json();
      setAiInsight({ ...data, type });
    } catch {
      setAiInsight({ error: "Failed to connect to AI Insight Engine." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRun = async () => {
    setIsExecuting(true);
    setAiInsight(null);
    setOutput("Compiling and executing...\n");
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, sourceCode: code, input })
      });
      const data = await res.json();

      if (!res.ok) {
        setOutput(`Error: ${data.error || 'Failed to execute'}`);
        setIsExecuting(false);
        return;
      }

      const runResult = data.run;
      if (runResult.code !== 0 || runResult.stderr) {
        const errorText = runResult.stderr || runResult.stdout;
        setOutput(`=== Execution Failed ===\n\n${errorText}`);
        fetchAIInsight('error_explanation', errorText);
        logErrorEvent('Execution/Syntax Error', errorText);
      } else {
        setOutput(`${runResult.stdout}\n=== Execution Successful ===`);
        fetchAIInsight('logic_explanation');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Cpu className={styles.logoIcon} size={28} />
          <span>Live Compiler <span className="text-secondary" style={{ color: 'var(--text-tertiary)' }}>& AI Intelligence</span></span>
        </div>
        <div className={styles.headerControls}>
          <select
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
          <button className={styles.runButton} onClick={handleRun} disabled={isExecuting}>
            {isExecuting ? <Activity className="animate-spin-slow" size={16} /> : <Play size={16} fill="white" />}
            {isExecuting ? "Executing..." : "Run Code"}
          </button>
        </div>
      </header>

      <main className={styles.workspace}>
        {/* Left Pane */}
        <div className={styles.leftPane}>
          <div className={styles.editorArea}>
            <div className={styles.panelHeader}>
              <Code2 size={16} /> Source Code
            </div>
            <div className={styles.panelContent} style={{ padding: 0 }}>
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{ fontSize: 14, minimap: { enabled: false }, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.panelHeader}>
              <Terminal size={16} /> Standard Input
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Enter program input here (if any)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        </div>

        {/* Right Pane */}
        <div className={styles.rightPane}>
          <div className={styles.outputArea}>
            <div className={styles.panelHeader}>
              <Terminal size={16} /> Execution Output
            </div>
            <div className={styles.panelContent}>
              <pre className="font-mono" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {output}
              </pre>
            </div>
          </div>

          <div className={styles.insightArea}>
            <div className={styles.panelHeader}>
              <Database size={16} /> AI Logic & Visualization
            </div>
            <div className={styles.panelContent}>
              {!aiInsight && !isAnalyzing && (
                <div className={`${styles.aiBox} ai-glow`}>
                  <div className={styles.aiBoxHeader}>
                    <Settings className="animate-spin-slow" size={18} />
                    <span>AI Insight Engine Standby</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Run your code to see AI-generated logic breakdowns, error explanations, and complexity analysis.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className={`${styles.aiBox} ai-glow`} style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Activity className="animate-spin-slow" size={32} color="var(--accent-purple)" />
                  <p style={{ marginTop: '1rem', color: 'var(--accent-purple)', fontWeight: 600 }}>Analyzing Execution Trace...</p>
                </div>
              )}

              {aiInsight && !isAnalyzing && (
                <div className={`${styles.aiBox} animate-fade-in`} style={{ border: `1px solid ${aiInsight.type === 'error_explanation' ? 'var(--accent-error)' : 'var(--accent-purple)'}`, paddingBottom: '3rem' }}>
                  <div className={styles.aiBoxHeader} style={{ color: aiInsight.type === 'error_explanation' ? 'var(--accent-error)' : 'var(--accent-purple)' }}>
                    {aiInsight.type === 'error_explanation' ? <AlertTriangle size={18} /> : <Lightbulb size={18} />}
                    <span>{aiInsight.title}</span>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong>Explanation:</strong> {aiInsight.explanation}
                  </div>

                  {aiInsight.fix && (
                    <div style={{ color: 'var(--text-primary)', background: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-warning)' }}>
                      <strong>Suggestion:</strong> {aiInsight.fix}
                    </div>
                  )}

                  {aiInsight.complexity && (
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                      <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Algorithm</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>{aiInsight.algorithm}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}><Zap size={12} style={{ display: 'inline', marginRight: 4 }} />Time Comp.</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{aiInsight.complexity.time}</div>
                      </div>
                      <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}><Database size={12} style={{ display: 'inline', marginRight: 4 }} />Space Comp.</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{aiInsight.complexity.space}</div>
                      </div>
                    </div>
                  )}

                  {aiInsight.visualizer && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div className={styles.panelHeader} style={{ background: 'transparent', padding: '0 0 0.5rem 0', color: 'var(--text-tertiary)' }}>
                        Data Structure State
                      </div>
                      <VisualizerController frames={aiInsight.visualizer.frames} type={aiInsight.visualizer.type} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
