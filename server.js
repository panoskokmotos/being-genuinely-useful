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

const server = http.createServer((req, res) => {
    // Parse URL and remove query strings
    let urlPath = req.url.split('?')[0];
    
    // Clean URL routing - map routes to files
    if (urlPath === '/') {
        urlPath = '/landing.html';
    } else if (urlPath === '/index' || urlPath === '/read') {
        urlPath = '/index.html';
    } else if (urlPath === '/cards') {
        urlPath = '/cards.html';
    } else if (!path.extname(urlPath)) {
        // If no extension and not a known route, try adding .html
        const htmlPath = path.join(__dirname, urlPath + '.html');
        if (fs.existsSync(htmlPath)) {
            urlPath = urlPath + '.html';
        }
    }
    
    const filePath = path.join(__dirname, urlPath);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // For missing files, return a nice 404
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
                res.writeHead(500);
                res.end('Server error: ' + err.code);
            }
        } else {
            // Set caching headers for static assets
            const cacheTime = extname === '.html' ? 0 : 86400; // 1 day for non-HTML
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': cacheTime > 0 ? `public, max-age=${cacheTime}` : 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
