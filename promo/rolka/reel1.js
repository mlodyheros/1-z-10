// przed app.js: czyste ustawienia, wyciszenie i udawane połączenie z serwerem
try { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('ts-muted', 'true'); localStorage.setItem('ts-lang', '"pl"'); } catch {}
window.FAKE = null;
window.WebSocket = class {
  constructor() { this.readyState = 1; window.FAKE = this; }
  send() {}
  close() { this.readyState = 3; }
};
