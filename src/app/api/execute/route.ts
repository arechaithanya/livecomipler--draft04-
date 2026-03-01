import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'temp_run');

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
}

function cleanup(...paths: string[]) {
    paths.forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { } });
}

async function runCmd(cmd: string, timeout = 5000): Promise<{ stdout: string; stderr: string; code: number }> {
    try {
        const { stdout, stderr } = await execAsync(cmd, { timeout });
        return { stdout, stderr, code: 0 };
    } catch (err: any) {
        return { stdout: err.stdout || '', stderr: err.stderr || err.message || '', code: err.code || 1 };
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { language, sourceCode, input } = body;

        if (!language || !sourceCode) {
            return NextResponse.json({ error: 'Language and source code are required.' }, { status: 400 });
        }

        ensureTempDir();
        const id = Date.now().toString();
        let result = { stdout: '', stderr: '', code: 0 };

        // ── JavaScript ──────────────────────────────────────────────────────
        if (language === 'javascript') {
            const file = path.join(TEMP_DIR, `${id}.js`);
            fs.writeFileSync(file, sourceCode);
            result = await runCmd(`node "${file}"`, 5000);
            cleanup(file);

            // ── Python ──────────────────────────────────────────────────────────
        } else if (language === 'python') {
            const file = path.join(TEMP_DIR, `${id}.py`);
            fs.writeFileSync(file, sourceCode);
            result = await runCmd(`python3 "${file}"`, 5000);
            cleanup(file);

            // ── C++ ─────────────────────────────────────────────────────────────
        } else if (language === 'cpp') {
            const src = path.join(TEMP_DIR, `${id}.cpp`);
            const out = path.join(TEMP_DIR, `${id}.out`);
            fs.writeFileSync(src, sourceCode);
            const compile = await runCmd(`g++ "${src}" -o "${out}" -std=c++17`, 8000);
            if (compile.code !== 0) {
                result = { stdout: '', stderr: compile.stderr, code: compile.code };
            } else {
                result = await runCmd(`"${out}"`, 5000);
            }
            cleanup(src, out);

            // ── Java ─────────────────────────────────────────────────────────────
        } else if (language === 'java') {
            // Extract public class name (required for Java)
            const classMatch = sourceCode.match(/public\s+class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : 'Main';
            const javaDir = path.join(TEMP_DIR, id);
            fs.mkdirSync(javaDir, { recursive: true });
            const src = path.join(javaDir, `${className}.java`);
            fs.writeFileSync(src, sourceCode);
            const compile = await runCmd(`javac "${src}"`, 10000);
            if (compile.code !== 0) {
                result = { stdout: '', stderr: compile.stderr, code: compile.code };
            } else {
                result = await runCmd(`java -cp "${javaDir}" ${className}`, 8000);
            }
            try { fs.rmSync(javaDir, { recursive: true, force: true }); } catch { }

            // ── Rust ─────────────────────────────────────────────────────────────
        } else if (language === 'rust') {
            // Try local rustc first, fall back to Rust playground API
            const rustcCheck = await runCmd('which rustc', 2000);
            if (rustcCheck.code === 0) {
                const src = path.join(TEMP_DIR, `${id}.rs`);
                const out = path.join(TEMP_DIR, `${id}_rust`);
                fs.writeFileSync(src, sourceCode);
                const compile = await runCmd(`rustc "${src}" -o "${out}"`, 15000);
                if (compile.code !== 0) {
                    result = { stdout: '', stderr: compile.stderr, code: compile.code };
                } else {
                    result = await runCmd(`"${out}"`, 5000);
                }
                cleanup(src, out);
            } else {
                // Rust Playground API
                try {
                    const resp = await fetch('https://play.rust-lang.org/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channel: 'stable', mode: 'debug', edition: '2021', crateType: 'bin', tests: false, code: sourceCode, backtrace: false }),
                    });
                    const data: any = await resp.json();
                    result = {
                        stdout: data.stdout || '',
                        stderr: data.stderr || '',
                        code: data.success ? 0 : 1
                    };
                } catch {
                    result = { stdout: '', stderr: 'Rust compiler not installed locally and playground API is unreachable. Install Rust via: curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh', code: 1 };
                }
            }

            // ── Go ───────────────────────────────────────────────────────────────
        } else if (language === 'go') {
            const goCheck = await runCmd('which go', 2000);
            if (goCheck.code === 0) {
                const goDir = path.join(TEMP_DIR, id);
                fs.mkdirSync(goDir, { recursive: true });
                const src = path.join(goDir, 'main.go');
                fs.writeFileSync(src, sourceCode);
                result = await runCmd(`go run "${src}"`, 15000);
                try { fs.rmSync(goDir, { recursive: true, force: true }); } catch { }
            } else {
                // Go Playground API
                try {
                    const resp = await fetch('https://go.dev/_/compile?backend=', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ version: '2', body: sourceCode }).toString(),
                    });
                    const data: any = await resp.json();
                    result = {
                        stdout: data.events?.map((e: any) => e.Message).join('') || '',
                        stderr: data.Errors || '',
                        code: data.Errors ? 1 : 0
                    };
                } catch {
                    result = { stdout: '', stderr: 'Go compiler not installed locally. Install Go from: https://go.dev/dl/', code: 1 };
                }
            }

        } else {
            return NextResponse.json({ error: `Language "${language}" is not supported for execution.` }, { status: 400 });
        }

        return NextResponse.json({ run: result });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
