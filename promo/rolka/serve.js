// serwer rolki: pliki z reel/ mają pierwszeństwo, reszta z public/ gry
const http = require('http'), fs = require('fs'), path = require('path');
const R = __dirname, PUB = path.join(__dirname, '..', '..', 'public');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p === '/index.html') {
    const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8')
      .replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="reel.css">')
      .replace('<script src="avatar.js"></script>', '<script src="reel1.js"></script><script src="avatar.js"></script>')
      .replace('<script src="app.js"></script>', '<script src="app.js"></script><script src="reel2.js"></script>');
    s.writeHead(200, { 'content-type': T['.html'] }); return s.end(html);
  }
  for (const d of [R, PUB]) {
    const f = path.join(d, path.normalize(p));
    if (f.startsWith(d) && fs.existsSync(f) && fs.statSync(f).isFile()) { s.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); return s.end(fs.readFileSync(f)); }
  }
  s.writeHead(404); s.end();
}).listen(3120, () => console.log('reel on 3120'));
