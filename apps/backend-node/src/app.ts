/**
 * Express application factory for omni-post backend (Node.js).
 * Mirrors: apps/backend/src/app.py
 */

import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTables } from './db/migrations.js';

// Route imports
import { router as accountRouter } from './routes/account.js';
import articleRouter from './routes/article.js';
import browserRouter from './routes/browser.js';
import { router as cookieRouter } from './routes/cookie.js';
import { router as dashboardRouter } from './routes/dashboard.js';
import explorerRouter from './routes/explorer.js';
import { router as fileRouter } from './routes/file.js';
import { router as groupRouter } from './routes/group.js';
import { router as publishRouter } from './routes/publish.js';
import { router as extensionRouter } from './routes/extension.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure the Express application.
 */
export function createApp(): Express {
    const app = express();

    // Rate limiting (FR-Security: prevents DOS and satisfies CodeQL)
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { code: 429, msg: 'Too many requests, please try again later.', data: null },
    });
    app.use(limiter);

    // CORS (match Flask-CORS behavior: allow all origins)
    app.use(cors());

    // JSON body parsing
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Initialize database tables
    createTables();

    // Register route blueprints under root prefix to match Python backend
    app.use('/', dashboardRouter);
    app.use('/', explorerRouter);
    app.use('/', accountRouter);
    app.use('/', articleRouter);
    app.use('/', browserRouter);
    app.use('/', fileRouter);
    app.use('/', cookieRouter);
    app.use('/', groupRouter);
    app.use('/', publishRouter);
    app.use('/', extensionRouter);

    // Static file serving (match Flask's static folder behavior)
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    app.use('/assets', express.static(path.join(frontendDistPath, 'assets')));
    app.get('/favicon.ico', (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'favicon.ico'), (err) => {
            if (err) res.status(204).end();
        });
    });
    app.get('/vite.svg', (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'vite.svg'), (err) => {
            if (err) res.status(204).end();
        });
    });

    // Serve index.html for root path
    app.get('/', (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
            if (err) res.status(404).json({ code: 404, msg: 'Frontend not built' });
        });
    });

    return app;
}
