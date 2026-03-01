import { NextResponse } from 'next/server';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractArrayLiteral(code: string): number[] | null {
    const match = code.match(/\[([^\[\]]+)\]/);
    if (!match) return null;
    const vals = match[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    return vals.length >= 2 ? vals.slice(0, 12) : null;
}

function extractNumbers(code: string): number[] {
    const matches = code.match(/-?\d+(\.\d+)?/g);
    if (!matches) return [];
    return [...new Set(matches.map(Number))].filter(n => !isNaN(n)).slice(0, 10);
}

function extractRecursiveFnName(code: string): string {
    const m = code.match(/(?:function|def)\s+(\w+)/);
    return m ? m[1] : 'fn';
}

function extractRecursiveArg(code: string, fnName: string): string {
    const m = code.match(new RegExp(`${fnName}\\s*\\(([^)]+)\\)`));
    return m ? m[1].trim() : 'n';
}

// ─── Frame generators ─────────────────────────────────────────────────────────

function generateArrayFrames(arr: number[]) {
    const frames: any[] = [];
    const work = arr.map((v, i) => ({ id: `e${i}`, value: v }));
    frames.push({ state: work.map(x => ({ ...x })), description: `Initial array: [${arr.join(', ')}]` });

    const n = work.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            frames.push({
                state: work.map((x, k) => ({ ...x, state: k === j || k === j + 1 ? 'comparing' : k >= n - i ? 'sorted' : 'default' })),
                description: `Comparing ${work[j].value} and ${work[j + 1].value}.`
            });
            if (work[j].value > work[j + 1].value) {
                frames.push({
                    state: work.map((x, k) => ({ ...x, state: k === j || k === j + 1 ? 'swapping' : k >= n - i ? 'sorted' : 'default' })),
                    description: `${work[j].value} > ${work[j + 1].value} — swapping!`
                });
                [work[j], work[j + 1]] = [work[j + 1], work[j]];
            }
        }
    }
    frames.push({ state: work.map(x => ({ ...x, state: 'sorted' })), description: `Sorted! [${work.map(x => x.value).join(', ')}]` });
    return frames;
}

function generateLinkedListFrames(arr: number[]) {
    const nodes = arr.map((v, i) => ({ id: `n${i}`, value: v }));
    const frames: any[] = [
        { state: nodes.map(n => ({ ...n, state: 'default' })), description: `Linked List: ${arr.join(' → ')} → NULL` }
    ];
    for (let i = 0; i < nodes.length; i++) {
        frames.push({
            state: nodes.map((n, k) => ({ ...n, state: k === i ? 'active' : k < i ? 'default' : 'default' })),
            description: `Traversing: visiting node [${i}] → value: ${nodes[i].value}${i === 0 ? ' (HEAD)' : ''}.`
        });
    }
    const newVal = (arr[arr.length - 1] ?? 0) + 10;
    const newNode = { id: `n${nodes.length}`, value: newVal };
    frames.push({
        state: [...nodes.map(n => ({ ...n, state: 'default' })), { ...newNode, state: 'creating' }],
        description: `Inserting new node with value ${newVal} at the tail.`
    });
    frames.push({
        state: [...nodes.map(n => ({ ...n, state: 'default' })), { ...newNode, state: 'found' }],
        description: `Tail pointer updated — ${newVal} linked. Insertion complete!`
    });
    return frames;
}

function generateTreeFrames(arr: number[]) {
    const positions = ['root', 'L', 'R', 'LL', 'LR', 'RL', 'RR'];
    const parentMap: Record<string, string> = { L: 'root', R: 'root', LL: 'L', LR: 'L', RL: 'R', RR: 'R' };
    const nodes = arr.slice(0, positions.length).map((v, i) => ({
        id: `n${i}`, value: v, pos: positions[i] as any, parentPos: parentMap[positions[i]]
    }));
    const frames: any[] = [{ state: [], description: 'Building tree from your values...' }];

    for (let i = 1; i <= nodes.length; i++) {
        const built = nodes.slice(0, i);
        const last = built[built.length - 1];
        frames.push({
            state: built.map((n, k) => ({ ...n, state: k === i - 1 ? 'inserting' : 'default' })),
            description: `Inserted ${last.value} at position ${last.pos}.`
        });
    }
    for (let i = 0; i < nodes.length; i++) {
        frames.push({
            state: nodes.map((n, k) => ({ ...n, state: k < i ? 'default' : k === i ? 'active' : 'default' })),
            description: `In-order traversal: visiting ${nodes[i].value} at ${nodes[i].pos}.`
        });
    }
    frames.push({ state: nodes.map(n => ({ ...n, state: 'found' })), description: 'Traversal complete — all nodes visited!' });
    return frames;
}

function generateStackFrames(arr: number[]) {
    const frames: any[] = [{ state: [], description: 'Stack is empty. Starting push operations.' }];
    const stack: any[] = [];

    for (let i = 0; i < arr.length; i++) {
        const pushing = { id: `s${i}`, value: arr[i], state: 'pushing' };
        stack.push(pushing);
        frames.push({
            state: stack.map((x, k) => ({ ...x, state: k === stack.length - 1 ? 'pushing' : 'default' })),
            description: `PUSH ${arr[i]} onto stack. Stack size: ${stack.length}.`
        });
        frames.push({
            state: stack.map((x, k) => ({ ...x, state: k === stack.length - 1 ? 'top' : 'default' })),
            description: `${arr[i]} is now on TOP of the stack.`
        });
    }

    // Pop all
    const snapshot = [...stack];
    for (let i = snapshot.length - 1; i >= 0; i--) {
        frames.push({
            state: stack.map((x, k) => ({ ...x, state: k === stack.length - 1 ? 'popping' : 'default' })),
            description: `POP — removing ${stack[stack.length - 1].value} from TOP (LIFO order).`
        });
        stack.pop();
        if (stack.length > 0) {
            frames.push({
                state: stack.map((x, k) => ({ ...x, state: k === stack.length - 1 ? 'top' : 'default' })),
                description: `Popped! New top is: ${stack[stack.length - 1].value}. Stack size: ${stack.length}.`
            });
        } else {
            frames.push({ state: [], description: 'Stack is now empty!' });
        }
    }

    return frames;
}

function generateQueueFrames(arr: number[]) {
    const frames: any[] = [{ state: [], description: 'Queue is empty. Starting enqueue operations.' }];
    const queue: any[] = [];

    for (let i = 0; i < arr.length; i++) {
        queue.push({ id: `q${i}`, value: arr[i], state: 'enqueuing' });
        frames.push({
            state: queue.map((x, k) => ({
                ...x,
                state: k === queue.length - 1 ? 'enqueuing' : k === 0 ? 'front' : 'default'
            })),
            description: `ENQUEUE ${arr[i]} at the rear. Queue size: ${queue.length}.`
        });
        frames.push({
            state: queue.map((x, k) => ({ ...x, state: k === 0 ? 'front' : 'default' })),
            description: `${arr[i]} added. Front: ${queue[0].value}, Rear: ${queue[queue.length - 1].value}.`
        });
    }

    // Dequeue all
    while (queue.length > 0) {
        const front = queue[0];
        frames.push({
            state: queue.map((x, k) => ({ ...x, state: k === 0 ? 'dequeuing' : 'default' })),
            description: `DEQUEUE — removing ${front.value} from FRONT (FIFO order).`
        });
        queue.shift();
        if (queue.length > 0) {
            frames.push({
                state: queue.map((x, k) => ({ ...x, state: k === 0 ? 'front' : 'default' })),
                description: `Dequeued! New front is: ${queue[0].value}. Queue size: ${queue.length}.`
            });
        } else {
            frames.push({ state: [], description: 'Queue is now empty!' });
        }
    }

    return frames;
}

function generateGraphFrames(arr: number[]) {
    const ids = ['A', 'B', 'C', 'D', 'E'];
    const nodeCount = Math.min(arr.length, ids.length);
    const nodes = arr.slice(0, nodeCount).map((v, i) => ({ id: ids[i], value: v }));
    const edges: any[] = [];
    for (let i = 0; i < nodeCount - 1; i++) edges.push({ source: ids[i], target: ids[i + 1] });
    if (nodeCount >= 3) edges.push({ source: ids[nodeCount - 1], target: ids[0] });

    const frames: any[] = [
        { state: { nodes: nodes.map(n => ({ ...n, state: 'default' })), edges: edges.map(e => ({ ...e })) }, description: `Graph of ${nodeCount} nodes with values: [${arr.slice(0, nodeCount).join(', ')}].` }
    ];

    const visited: string[] = [];
    for (let i = 0; i < nodeCount; i++) {
        visited.push(ids[i]);
        frames.push({
            state: {
                nodes: nodes.map(n => ({ ...n, state: visited.includes(n.id) ? 'visited' : i + 1 < nodeCount && n.id === ids[i + 1] ? 'exploring' : 'default' })),
                edges: edges.map(e => ({ ...e, state: e.source === ids[i] ? 'active' : visited.includes(e.source) ? 'visited' : 'default' }))
            },
            description: `BFS: Visited node ${ids[i]} (value: ${nodes[i].value}). Neighbors queued: ${edges.filter(e => e.source === ids[i]).map(e => e.target).join(', ') || 'none'}.`
        });
    }
    frames.push({
        state: { nodes: nodes.map(n => ({ ...n, state: 'visited' })), edges: edges.map(e => ({ ...e, state: 'visited' })) },
        description: 'BFS traversal complete — all nodes visited!'
    });
    return frames;
}

function generateRecursionFrames(code: string) {
    const fnName = extractRecursiveFnName(code);
    const argName = extractRecursiveArg(code, fnName);
    const startN = 4;
    const frames: any[] = [];
    const stack: any[] = [];

    for (let i = startN; i >= 1; i--) {
        stack.push({ id: `f${i}`, functionName: fnName, params: `${argName} = ${i}`, state: 'active' });
        frames.push({
            state: stack.map((f, k) => ({ ...f, state: k === stack.length - 1 ? 'active' : 'paused' })),
            description: i > 1 ? `Calling ${fnName}(${i}) → waiting for ${fnName}(${i - 1}).` : `${fnName}(1) — base case reached!`
        });
    }

    for (let i = 1; i <= startN; i++) {
        const fact = Array.from({ length: i }, (_, j) => j + 1).reduce((a, b) => a * b, 1);
        const retVal = i === 1 ? '1' : `${i} × ${fact / i} = ${fact}`;
        stack[stack.length - i] = { ...stack[stack.length - i], returnValue: retVal, state: 'returning' };
        frames.push({
            state: stack.slice(0, stack.length - i + 1).map((f, k, arr) => ({ ...f, state: k === arr.length - 1 ? 'returning' : 'paused' })),
            description: `Returning from ${fnName}(${i}): result = ${retVal}.`
        });
    }

    return frames;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, language, errorMsg, type } = body;

        await new Promise(resolve => setTimeout(resolve, 1200));

        if (type === 'error_explanation' && errorMsg) {
            return NextResponse.json({
                title: "Syntax Error Detected",
                explanation: "The compiler found an unexpected token. Check for missing semicolons, unclosed brackets, or typos.",
                fix: "Fix the syntax issue on the indicated line.",
                complexity: null, algorithm: null
            });
        }

        if (type === 'logic_explanation') {
            const hasLoop = code.includes('for') || code.includes('while');
            const hasRecursion = !!(code.match(/function\s+(\w+)[^{]*\{[\s\S]*?\1\s*\(/) || code.match(/def\s+(\w+)[^:]*:[\s\S]*?\1\s*\(/));

            let algo = "Linear Execution", timeComp = "O(1)", spaceComp = "O(1)";
            let explanation = "This program executes a straightforward sequence of instructions.";

            if (hasRecursion) {
                algo = "Recursion"; timeComp = "O(2ⁿ) or O(n)"; spaceComp = "O(n) — stack space";
                explanation = "The code uses recursion — calling itself to solve smaller subproblems.";
            } else if (hasLoop) {
                algo = "Iterative"; timeComp = "O(n)"; spaceComp = "O(1)";
                explanation = "The program iterates over data using a loop, processing elements one by one.";
                if (code.match(/for[\s\S]{0,200}for|while[\s\S]{0,200}while/)) {
                    algo = "Nested Loops"; timeComp = "O(n²)";
                }
            }

            // ── Pattern detection ─────────────────────────────────────────
            const codeL = code.toLowerCase();
            const isStack = codeL.includes('stack') || (codeL.includes('push') && codeL.includes('pop')) || codeL.includes('lifo');
            const isQueue = codeL.includes('queue') || (codeL.includes('enqueue') || codeL.includes('dequeue')) || codeL.includes('fifo') || (codeL.includes('push') && (codeL.includes('shift') || codeL.includes('dequeue')));
            const isList = codeL.includes('linkedlist') || codeL.includes('node') && codeL.includes('next') || code.includes('->next') || code.includes('.next');
            const isTree = (codeL.includes('left') && codeL.includes('right')) || codeL.includes('tree') || codeL.includes('bst') || codeL.includes('treenode');
            const isGraph = codeL.includes('addedge') || codeL.includes('graph') || codeL.includes('adjacency') || (codeL.includes('visited') && codeL.includes('edge'));
            const isRecursion = hasRecursion || codeL.includes('factorial') || codeL.includes('fibonacci') || codeL.includes('fib');

            const arrayLiteral = extractArrayLiteral(code);
            const numbers = arrayLiteral ?? extractNumbers(code);

            let vizType = 'array';
            let frames: any[];
            let displayAlgo = algo;

            if (isStack) {
                vizType = 'stack'; displayAlgo = 'Stack Operations (LIFO)';
                const vals = numbers.length >= 2 ? numbers : [10, 20, 30, 40, 50];
                frames = generateStackFrames(vals);
            } else if (isQueue) {
                vizType = 'queue'; displayAlgo = 'Queue Operations (FIFO)';
                const vals = numbers.length >= 2 ? numbers : [10, 20, 30, 40, 50];
                frames = generateQueueFrames(vals);
            } else if (isTree) {
                vizType = 'tree'; displayAlgo = 'Tree Traversal';
                const vals = numbers.length >= 2 ? numbers : [50, 25, 75, 10, 30, 60, 80];
                frames = generateTreeFrames(vals);
            } else if (isGraph) {
                vizType = 'graph'; displayAlgo = 'Graph Traversal (BFS)';
                const vals = numbers.length >= 2 ? numbers : [1, 2, 3, 4, 5];
                frames = generateGraphFrames(vals);
            } else if (isList) {
                vizType = 'linkedlist'; displayAlgo = 'Linked List Traversal';
                const vals = numbers.length >= 2 ? numbers : [10, 20, 30, 40];
                frames = generateLinkedListFrames(vals);
            } else if (isRecursion) {
                vizType = 'recursion'; displayAlgo = 'Recursive Call Stack';
                frames = generateRecursionFrames(code);
            } else {
                vizType = 'array'; displayAlgo = numbers.length >= 2 ? 'Bubble Sort Trace' : 'Linear Execution';
                const vals = numbers.length >= 2 ? numbers : [8, 3, 7, 1, 5];
                frames = generateArrayFrames(vals);
            }

            return NextResponse.json({
                title: `${displayAlgo} Breakdown`,
                explanation,
                fix: "Tip: look for repeated subproblems that can be memoized or cached for better performance.",
                complexity: { time: timeComp, space: spaceComp },
                algorithm: displayAlgo,
                visualizer: { type: vizType, frames }
            });
        }

        return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "AI Analysis Error" }, { status: 500 });
    }
}
