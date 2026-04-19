const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.md': 'text/markdown',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Extensions that must not be decoded as UTF-8 strings
const BINARY_EXTS = new Set(['.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf']);

const server = http.createServer((req, res) => {
    const reqStart = Date.now();

    // Parse URL and remove query strings
    let urlPath = req.url.split('?')[0];

    // Clean URL routing - map routes to files
    if (urlPath === '/' || urlPath === '/index') {
        urlPath = '/index.html';
    } else if (urlPath === '/cards') {
        urlPath = '/cards.html';
    } else if (!path.extname(urlPath)) {
        // Probe for .html variant — validate the candidate stays inside the project first
        const candidate = path.resolve(__dirname, urlPath.slice(1) + '.html');
        if (candidate.startsWith(__dirname + path.sep) && fs.existsSync(candidate)) {
            urlPath = urlPath + '.html';
        }
    }

    // Resolve the final path and reject any traversal attempts
    const filePath = path.resolve(__dirname, urlPath.slice(1));
    if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) {
        const duration = Date.now() - reqStart;
        console.log(`${new Date().toISOString()} ${req.method} ${req.url} → 403 (${duration}ms)`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    const isBinary = BINARY_EXTS.has(extname);

    // Binary files must be read without an encoding argument so the raw Buffer
    // is passed to res.end — UTF-8 decoding corrupts fonts and images.
    fs.readFile(filePath, isBinary ? null : 'utf-8', (err, content) => {
        const duration = Date.now() - reqStart;

        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`${new Date().toISOString()} ${req.method} ${req.url} → 404 (${duration}ms)`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Not Found</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0a0a;
            color: #fafafa;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            text-align: center;
            padding: 20px;
        }
        h1 { font-size: 4rem; margin: 0 0 16px; color: #22c55e; }
        p { color: #a1a1aa; margin-bottom: 24px; }
        a {
            background: #22c55e;
            color: #0a0a0a;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: background 0.2s;
        }
        a:hover { background: #16a34a; }
    </style>
</head>
<body>
    <h1>404</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
</body>
</html>
                `, 'utf-8');
            } else {
                console.error(`${new Date().toISOString()} ${req.method} ${req.url} → 500 (${duration}ms)`, err);
                res.writeHead(500);
                res.end('Server error: ' + err.code);
            }
        } else {
            const cacheTime = extname === '.html' ? 0 : 86400; // 1 day for non-HTML
            console.log(`${new Date().toISOString()} ${req.method} ${req.url} → 200 (${duration}ms)`);
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': cacheTime > 0 ? `public, max-age=${cacheTime}` : 'no-cache'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
