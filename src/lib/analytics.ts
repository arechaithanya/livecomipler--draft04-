// A simple in-memory or localStorage based analytics tracker for the MVP

export const logErrorEvent = (errorType: string, message: string) => {
    if (typeof window === 'undefined') return;

    const history = JSON.parse(localStorage.getItem('compiler_analytics') || '[]');
    history.push({
        timestamp: new Date().toISOString(),
        type: errorType,
        message
    });

    localStorage.setItem('compiler_analytics', JSON.stringify(history));
};

export const getAnalyticsSummary = () => {
    if (typeof window === 'undefined') return { total: 0, common: 'None' };

    const history = JSON.parse(localStorage.getItem('compiler_analytics') || '[]');

    // Basic heuristic for common error
    const counts: Record<string, number> = {};
    history.forEach((h: any) => {
        counts[h.type] = (counts[h.type] || 0) + 1;
    });

    let common = 'None';
    let max = 0;
    for (const [type, count] of Object.entries(counts)) {
        if ((count as number) > max) {
            max = count as number;
            common = type;
        }
    }

    return { total: history.length, common };
};
