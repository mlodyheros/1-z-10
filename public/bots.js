// Galeria gotowych botów: znane postacie i znajomi. Wspólna dla serwera i przeglądarki.
// Pola z "Hex" i "num" to dodatki dostępne tylko dla botów z galerii (własne kolory, numer na koszulce).
const BOT_GALLERY = [
  // --- znajomi ---
  { id: 'adam', group: 'friends', name: 'Adam', avatar: { skin: 0, hair: 0, hairColor: 1, eyes: 8, eyeHex: '#7d8f86', mouth: 8, beard: 5, hat: 9, outfit: 6, shirtHex: '#9a9c9b', hoodUp: 1 } },
  { id: 'hania', group: 'friends', name: 'Hania', avatar: { skin: 0, hair: 3, hairColor: 2, eyes: 8, eyeHex: '#6b4a2a', mouth: 0, hat: 9, hatHex: '#5a2340', hatHex2: '#f29ac0', outfit: 8, shirtHex: '#2a2420' } },
  { id: 'rozek', group: 'friends', name: 'Rożek', avatar: { skin: 0, hair: 12, hairHex: '#dcc083', eyes: 8, eyeHex: '#6f93b5', mouth: 8, outfit: 6, shirtHex: '#70747b', trimHex: '#3a3f4b', txt: 'USPA' } },
  { id: 'bieryl', group: 'friends', name: 'Bierył', avatar: { skin: 0, hair: 13, hairHex: '#d3a85c', eyes: 8, eyeHex: '#5f86ad', mouth: 0, outfit: 6, shirtHex: '#a9cdf0', trimHex: '#1c2a52' } },
  { id: 'filip', group: 'friends', name: 'Filip', avatar: { skin: 1, hair: 14, hairHex: '#4a3524', eyes: 8, eyeHex: '#5a3d22', mouth: 7, outfit: 9, shirtHex: '#1d1d26' } },
  // --- sport ---
  { id: 'lebron', group: 'sport', name: 'LeBron James', avatar: { skin: 5, hair: 1, hairColor: 0, eyes: 0, mouth: 0, beard: 3, outfit: 7, shirtHex: '#fdb927', trimHex: '#552583', num: 23 } },
  { id: 'jordan', group: 'sport', name: 'Michael Jordan', avatar: { skin: 5, hair: 0, eyes: 0, mouth: 7, beard: 1, hairColor: 0, outfit: 7, shirtHex: '#ce1141', trimHex: '#111111', num: 23 } },
  { id: 'messi', group: 'sport', name: 'Leo Messi', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 0, beard: 3, outfit: 7, shirtHex: '#75aadb', trimHex: '#ffffff', num: 10 } },
  { id: 'ronaldo', group: 'sport', name: 'Cristiano Ronaldo', avatar: { skin: 2, hair: 10, hairColor: 0, eyes: 0, mouth: 8, outfit: 7, shirtHex: '#c8102e', trimHex: '#0b6b3a', num: 7 } },
  { id: 'lewy', group: 'sport', name: 'Lewandowski', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 0, outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d', num: 9 } },
  { id: 'mbappe', group: 'sport', name: 'Kylian Mbappé', avatar: { skin: 5, hair: 1, hairColor: 0, eyes: 0, mouth: 8, outfit: 7, shirtHex: '#1f2a5c', trimHex: '#e63946', num: 10 } },
  { id: 'haaland', group: 'sport', name: 'Erling Haaland', avatar: { skin: 0, hair: 9, hairHex: '#f0d98a', eyes: 4, mouth: 5, outfit: 7, shirtHex: '#6cabdd', trimHex: '#ffffff', num: 9 } },
  { id: 'iga', group: 'sport', name: 'Iga Świątek', avatar: { skin: 1, hair: 9, hairHex: '#b98a4e', eyes: 7, mouth: 0, hat: 1, hatHex: '#f5f5f5', hatHex2: '#d9d9de', outfit: 2, shirtHex: '#f5f5f5' } },
  { id: 'malysz', group: 'sport', name: 'Adam Małysz', avatar: { skin: 1, hair: 1, hairColor: 2, eyes: 0, mouth: 0, beard: 1, hat: 1, outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d' } },
  // --- muzyka ---
  { id: 'kanye', group: 'music', name: 'Kanye West', avatar: { skin: 5, hair: 1, hairColor: 0, eyes: 0, mouth: 2, beard: 4, glasses: 3, outfit: 6, shirtHex: '#2a2a31' } },
  { id: 'travis', group: 'music', name: 'Travis Scott', avatar: { skin: 5, hair: 2, hairHex: '#2a1a12', eyes: 5, mouth: 7, beard: 4, outfit: 6, shirtHex: '#6b4a2f' } },
  { id: 'drake', group: 'music', name: 'Drake', avatar: { skin: 3, hair: 1, hairColor: 0, eyes: 0, mouth: 0, beard: 3, outfit: 6, shirtHex: '#d9a900' } },
  { id: 'eminem', group: 'music', name: 'Eminem', avatar: { skin: 0, hair: 1, hairHex: '#efe2a0', eyes: 3, mouth: 2, outfit: 6, shirtHex: '#e9e9ee' } },
  { id: 'snoop', group: 'music', name: 'Snoop Dogg', avatar: { skin: 5, hair: 3, hairColor: 0, eyes: 2, mouth: 0, beard: 2, glasses: 3, outfit: 1, shirtHex: '#2b55c9' } },
  { id: 'weeknd', group: 'music', name: 'The Weeknd', avatar: { skin: 5, hair: 7, hairColor: 0, eyes: 0, mouth: 0, beard: 4, outfit: 3, shirtHex: '#c1121f' } },
  { id: 'mj', group: 'music', name: 'Michael Jackson', avatar: { skin: 3, hair: 8, hairColor: 0, eyes: 7, mouth: 0, outfit: 2, shirtHex: '#c1121f' } },
  { id: 'elvis', group: 'music', name: 'Elvis Presley', avatar: { skin: 1, hair: 10, hairColor: 0, eyes: 0, mouth: 7, outfit: 5, shirtHex: '#f5f5f5' } },
  { id: 'billie', group: 'music', name: 'Billie Eilish', avatar: { skin: 0, hair: 3, hairHex: '#2be36b', eyes: 2, mouth: 2, outfit: 6, shirtHex: '#1c1c1f' } },
  { id: 'taylor', group: 'music', name: 'Taylor Swift', avatar: { skin: 0, hair: 3, hairHex: '#e8c877', eyes: 7, mouth: 0, outfit: 5, shirtHex: '#d94f9a' } },
  { id: 'rihanna', group: 'music', name: 'Rihanna', avatar: { skin: 4, hair: 3, hairHex: '#8f1027', eyes: 7, mouth: 7, outfit: 4, shirtHex: '#22222a' } },
  { id: 'beyonce', group: 'music', name: 'Beyoncé', avatar: { skin: 4, hair: 3, hairHex: '#c9953d', eyes: 7, mouth: 8, outfit: 5, shirtHex: '#d9a900' } },
  { id: 'sheeran', group: 'music', name: 'Ed Sheeran', avatar: { skin: 0, hair: 2, hairColor: 5, eyes: 0, mouth: 0, beard: 4, outfit: 8, shirtHex: '#8f2a22' } },
  { id: 'sanah', group: 'music', name: 'sanah', avatar: { skin: 0, hair: 3, hairColor: 2, eyes: 7, mouth: 0, hat: 8, outfit: 4, shirtHex: '#f0a6c8' } },
  { id: 'podsiadlo', group: 'music', name: 'Dawid Podsiadło', avatar: { skin: 1, hair: 12, hairColor: 1, eyes: 0, mouth: 0, beard: 3, outfit: 0, shirtHex: '#2f5d50' } },
  // --- gwiazdy światowe ---
  { id: 'mrbeast', group: 'world', name: 'MrBeast', avatar: { skin: 1, hair: 1, hairColor: 1, eyes: 0, mouth: 8, beard: 4, outfit: 6, shirtHex: '#2ba6c9' } },
  { id: 'musk', group: 'world', name: 'Elon Musk', avatar: { skin: 0, hair: 10, hairColor: 1, eyes: 0, mouth: 7, outfit: 0, shirtHex: '#1c1c1f' } },
  { id: 'rock', group: 'world', name: 'The Rock', avatar: { skin: 4, hair: 0, hairColor: 0, eyes: 4, mouth: 7, outfit: 0, shirtHex: '#22222a' } },
  { id: 'keanu', group: 'world', name: 'Keanu Reeves', avatar: { skin: 1, hair: 8, hairColor: 0, eyes: 0, mouth: 2, beard: 3, outfit: 3, shirtHex: '#22222a' } },
  { id: 'dicaprio', group: 'world', name: 'Leonardo DiCaprio', avatar: { skin: 0, hair: 10, hairColor: 3, eyes: 0, mouth: 7, beard: 4, outfit: 4, shirtHex: '#22222a' } },
  { id: 'zendaya', group: 'world', name: 'Zendaya', avatar: { skin: 3, hair: 13, hairHex: '#3a2415', eyes: 7, mouth: 0, outfit: 5, shirtHex: '#8a4fd6' } },
  { id: 'einstein', group: 'world', name: 'Albert Einstein', avatar: { skin: 1, hair: 7, hairColor: 7, eyes: 4, mouth: 4, beard: 1, outfit: 3, shirtHex: '#8a5a3c' } },
];
if (typeof module !== 'undefined') module.exports = BOT_GALLERY;
