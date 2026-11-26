// Serves the Vanmoh website (repo root) on the LAN so Expo Go on your phone can load it.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  const p = path.resolve(root, '.' + u);
  if (!p.startsWith(root + path.sep) || p.includes(path.sep + '.git')) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, b) => {
    if (e) { // SPA fallback like vercel.json
      return fs.readFile(path.join(root, 'index.html'), (e2, b2) => { res.setHeader('Content-Type', types['.html']); res.end(b2); });
    }
    res.setHeader('Content-Type', types[path.extname(p)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(b);
  });
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('Vanmoh web preview:'); console.log('  http://localhost:' + PORT); ips.forEach(ip => console.log('  http://' + ip + ':' + PORT));
});
