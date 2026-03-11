import http from 'http';
import { performance } from 'perf_hooks';

const PORT = process.env.PORT || 5409;
const ENDPOINT = `http://127.0.0.1:${PORT}/api/publish/tasks`;
const REQUESTS = 500;
const CONCURRENCY = 10;

async function makeRequest(): Promise<number> {
    return new Promise((resolve) => {
        const start = performance.now();
        http.get(ENDPOINT, (res) => {
            res.on('data', () => { });
            res.on('end', () => resolve(performance.now() - start));
        }).on('error', () => resolve(-1));
    });
}

async function runBenchmark() {
    console.log(`\nStarting benchmark against ${ENDPOINT}`);
    console.log(`Total Requests: ${REQUESTS}, Concurrency: ${CONCURRENCY}`);

    let completed = 0;
    let failed = 0;
    const times: number[] = [];

    const startOverall = performance.now();

    const workers = Array(CONCURRENCY).fill(0).map(async () => {
        while (completed + failed < REQUESTS) {
            // preemptively increment to prevent over-requesting
            const index = completed + failed;
            if (index >= REQUESTS) break;

            const time = await makeRequest();
            if (time > -1) {
                times.push(time);
                completed++;
            } else {
                failed++;
            }
        }
    });

    await Promise.all(workers);

    const endOverall = performance.now();
    const totalTime = endOverall - startOverall;

    times.sort((a, b) => a - b);
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const p95 = times.length > 0 ? times[Math.floor(times.length * 0.95)] : 0;
    const rps = (completed / totalTime) * 1000;

    console.log('--- Results ---');
    console.log(`Total Time: ${totalTime.toFixed(2)} ms`);
    console.log(`Completed: ${completed}, Failed: ${failed}`);
    console.log(`Requests/sec: ${rps.toFixed(2)}`);
    console.log(`Avg Latency: ${avg.toFixed(2)} ms`);
    console.log(`p95 Latency: ${p95.toFixed(2)} ms\n`);
}

runBenchmark().catch(console.error);
