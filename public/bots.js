// Galeria gotowych botów: znane postacie i znajomi. Wspólna dla serwera i przeglądarki.
// Pola z "Hex" i "num" to dodatki dostępne tylko dla botów z galerii (własne kolory, numer na koszulce).
const BOT_GALLERY = [
  // --- znajomi ---
  { id: 'adam', group: 'friends', name: 'Adam', avatar: { skin: 0, hair: 0, hairColor: 1, eyes: 0, mouth: 2, beard: 5, hat: 9, outfit: 6, shirtHex: '#9a9c9b', hoodUp: 1, buds: 1 } },
  { id: 'hania', group: 'friends', name: 'Hania', avatar: { skin: 0, hair: 3, hairColor: 2, eyes: 7, mouth: 0, hat: 9, hatHex: '#5a2340', hatHex2: '#f29ac0', outfit: 8, shirtHex: '#2a2420' } },
  { id: 'rozek', group: 'friends', name: 'Rożek', avatar: { skin: 0, hair: 10, hairHex: '#d9b56c', eyes: 5, mouth: 5, outfit: 6, shirtHex: '#6d7178' } },
  { id: 'bieryl', group: 'friends', name: 'Bierył', avatar: { skin: 0, hair: 6, hairHex: '#d2a65a', eyes: 0, mouth: 0, outfit: 6, shirtHex: '#a9cdf0' } },
  { id: 'filip', group: 'friends', name: 'Filip', avatar: { skin: 1, hair: 6, hairColor: 1, eyes: 0, mouth: 7, outfit: 1, shirtHex: '#f1efe8', trimHex: '#1d1d26' } },
  // --- gwiazdy ---
  { id: 'lebron', group: 'stars', name: 'LeBron James', avatar: { skin: 5, hair: 1, hairColor: 0, eyes: 0, mouth: 0, beard: 3, outfit: 7, shirtHex: '#fdb927', trimHex: '#552583', num: 23 } },
  { id: 'jordan', group: 'stars', name: 'Michael Jordan', avatar: { skin: 5, hair: 0, eyes: 0, mouth: 7, beard: 1, hairColor: 0, outfit: 7, shirtHex: '#ce1141', trimHex: '#111111', num: 23 } },
  { id: 'messi', group: 'stars', name: 'Leo Messi', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 0, beard: 3, outfit: 7, shirtHex: '#75aadb', trimHex: '#ffffff', num: 10 } },
  { id: 'ronaldo', group: 'stars', name: 'Cristiano Ronaldo', avatar: { skin: 2, hair: 10, hairColor: 0, eyes: 0, mouth: 1, outfit: 7, shirtHex: '#c8102e', trimHex: '#0b6b3a', num: 7 } },
  { id: 'lewy', group: 'stars', name: 'Lewandowski', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 0, outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d', num: 9 } },
  { id: 'mbappe', group: 'stars', name: 'Kylian Mbappé', avatar: { skin: 5, hair: 1, hairColor: 0, eyes: 0, mouth: 1, outfit: 7, shirtHex: '#1f2a5c', trimHex: '#e63946', num: 10 } },
  { id: 'haaland', group: 'stars', name: 'Erling Haaland', avatar: { skin: 0, hair: 9, hairHex: '#f0d98a', eyes: 4, mouth: 5, outfit: 7, shirtHex: '#6cabdd', trimHex: '#ffffff', num: 9 } },
  { id: 'iga', group: 'stars', name: 'Iga Świątek', avatar: { skin: 1, hair: 9, hairHex: '#b98a4e', eyes: 7, mouth: 0, hat: 1, hatHex: '#f5f5f5', hatHex2: '#d9d9de', outfit: 2, shirtHex: '#f5f5f5' } },
  { id: 'malysz', group: 'stars', name: 'Adam Małysz', avatar: { skin: 1, hair: 1, hairColor: 2, eyes: 0, mouth: 0, beard: 1, hat: 1, outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d' } },
  { id: 'taylor', group: 'stars', name: 'Taylor Swift', avatar: { skin: 0, hair: 3, hairHex: '#e8c877', eyes: 7, mouth: 0, outfit: 5, shirtHex: '#d94f9a' } },
  { id: 'mrbeast', group: 'stars', name: 'MrBeast', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 5, beard: 4, outfit: 6, shirtHex: '#2ba6c9' } },
  { id: 'einstein', group: 'stars', name: 'Albert Einstein', avatar: { skin: 1, hair: 7, hairColor: 7, eyes: 4, mouth: 4, beard: 1, outfit: 3, shirtHex: '#8a5a3c' } },
];
if (typeof module !== 'undefined') module.exports = BOT_GALLERY;
