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
  { id: 'lebron', group: 'sport', name: 'LeBron James', avatar: { skinHex: '#6b4226', hair: 15, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 0, beard: 3, headband: '#f5f5f5', outfit: 7, shirtHex: '#fdb927', trimHex: '#552583', num: 23 } },
  { id: 'jordan', group: 'sport', name: 'Michael Jordan', avatar: { skinHex: '#5a3620', hair: 0, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 4, beard: 1, stud: 1, outfit: 7, shirtHex: '#ce1141', trimHex: '#111111', num: 23 } },
  { id: 'messi', group: 'sport', name: 'Leo Messi', avatar: { skinHex: '#f0c9a4', hair: 10, hairHex: '#5a3a22', eyes: 8, eyeHex: '#5a3d22', mouth: 0, beard: 3, outfit: 7, shirtHex: '#75aadb', trimHex: '#ffffff', num: 10 } },
  { id: 'ronaldo', group: 'sport', name: 'Cristiano Ronaldo', avatar: { skinHex: '#d9a577', hair: 16, hairColor: 0, eyes: 8, eyeHex: '#5a3d22', mouth: 8, outfit: 7, shirtHex: '#c8102e', trimHex: '#0b6b3a', num: 7 } },
  { id: 'lewy', group: 'sport', name: 'Lewandowski', avatar: { skinHex: '#f1c9a5', hair: 10, hairHex: '#4a3524', eyes: 8, eyeHex: '#6f93b5', mouth: 0, outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d', num: 9 } },
  { id: 'mbappe', group: 'sport', name: 'Kylian Mbappé', avatar: { skinHex: '#7a4a2a', hair: 15, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 8, outfit: 7, shirtHex: '#1f2a5c', trimHex: '#e63946', num: 10 } },
  { id: 'haaland', group: 'sport', name: 'Erling Haaland', avatar: { skinHex: '#f6d3b8', hair: 9, hairHex: '#f0d98a', eyes: 8, eyeHex: '#6f93b5', mouth: 8, outfit: 7, shirtHex: '#6cabdd', trimHex: '#ffffff', num: 9 } },
  { id: 'iga', group: 'sport', name: 'Iga Świątek', avatar: { skinHex: '#f1c9a5', hair: 9, hairHex: '#b98a4e', eyes: 8, eyeHex: '#7d8f86', mouth: 0, hat: 1, hatHex: '#f5f5f5', hatHex2: '#d9d9de', outfit: 2, shirtHex: '#f5f5f5' } },
  { id: 'malysz', group: 'sport', name: 'Adam Małysz', avatar: { skinHex: '#f1c9a5', hair: 1, hairHex: '#8a6a3c', eyes: 8, eyeHex: '#6f93b5', mouth: 0, beard: 1, hat: 1, hatHex: '#f5f5f5', hatHex2: '#d4213d', outfit: 7, shirtHex: '#f5f5f5', trimHex: '#d4213d' } },
  // --- muzyka ---
  { id: 'kanye', group: 'music', name: 'Kanye West', avatar: { skinHex: '#6b4226', hair: 15, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 2, beard: 4, glasses: 3, chain: 1, outfit: 6, shirtHex: '#2a2a31' } },
  { id: 'travis', group: 'music', name: 'Travis Scott', avatar: { skinHex: '#6b4226', hair: 17, hairHex: '#2a1a12', eyes: 8, eyeHex: '#3a2415', mouth: 7, beard: 4, chain: 1, outfit: 0, shirtHex: '#6b4a2f' } },
  { id: 'drake', group: 'music', name: 'Drake', avatar: { skinHex: '#b07a4f', hair: 15, hairColor: 0, eyes: 8, eyeHex: '#4a2f1a', mouth: 0, beard: 3, chain: 1, outfit: 6, shirtHex: '#1c1c1f' } },
  { id: 'eminem', group: 'music', name: 'Eminem', avatar: { skinHex: '#f3d0b3', hair: 15, hairHex: '#e9dca0', eyes: 8, eyeHex: '#6f93b5', mouth: 2, outfit: 6, shirtHex: '#8b8f98' } },
  { id: 'snoop', group: 'music', name: 'Snoop Dogg', avatar: { skinHex: '#5a3620', hair: 17, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 0, beard: 2, glasses: 3, chain: 1, outfit: 1, shirtHex: '#2b55c9' } },
  { id: 'weeknd', group: 'music', name: 'The Weeknd', avatar: { skinHex: '#6b4226', hair: 13, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 0, beard: 3, outfit: 3, shirtHex: '#c1121f' } },
  { id: 'mj', group: 'music', name: 'Michael Jackson', avatar: { skinHex: '#b07a4f', hair: 8, hairColor: 0, eyes: 8, eyeHex: '#3a2415', mouth: 0, hat: 10, outfit: 2, shirtHex: '#c1121f' } },
  { id: 'elvis', group: 'music', name: 'Elvis Presley', avatar: { skinHex: '#f1c9a5', hair: 16, hairColor: 0, eyes: 8, eyeHex: '#5f86ad', mouth: 7, burns: 1, outfit: 10, shirtHex: '#f5f5f5' } },
  { id: 'billie', group: 'music', name: 'Billie Eilish', avatar: { skinHex: '#f6d9c4', hair: 3, hairHex: '#17171c', rootHex: '#2be36b', eyes: 8, eyeHex: '#7fb0d6', mouth: 2, chain: 1, outfit: 6, shirtHex: '#1c1c1f' } },
  { id: 'taylor', group: 'music', name: 'Taylor Swift', avatar: { skinHex: '#f6d9c4', hair: 19, hairHex: '#e8c877', eyes: 8, eyeHex: '#6f93b5', mouth: 0, lipHex: '#c1121f', outfit: 5, shirtHex: '#d94f9a' } },
  { id: 'rihanna', group: 'music', name: 'Rihanna', avatar: { skinHex: '#a9764c', hair: 3, hairHex: '#8f1027', eyes: 8, eyeHex: '#7a8f4a', mouth: 7, lipHex: '#7a1022', stud: 1, outfit: 4, shirtHex: '#22222a' } },
  { id: 'beyonce', group: 'music', name: 'Beyoncé', avatar: { skinHex: '#b98458', hair: 3, hairHex: '#c9953d', eyes: 8, eyeHex: '#4a2f1a', mouth: 8, lipHex: '#b5503c', stud: 1, outfit: 5, shirtHex: '#d9a900' } },
  { id: 'sheeran', group: 'music', name: 'Ed Sheeran', avatar: { skinHex: '#f6d3b8', hair: 12, hairHex: '#d9662b', eyes: 8, eyeHex: '#6f93b5', mouth: 0, beard: 4, outfit: 8, shirtHex: '#8f2a22' } },
  { id: 'sanah', group: 'music', name: 'sanah', avatar: { skinHex: '#f6d9c4', hair: 19, hairHex: '#6b4a2a', eyes: 8, eyeHex: '#5a3d22', mouth: 0, lipHex: '#e0708f', hat: 8, outfit: 4, shirtHex: '#f0a6c8' } },
  { id: 'podsiadlo', group: 'music', name: 'Dawid Podsiadło', avatar: { skinHex: '#f1c9a5', hair: 12, hairHex: '#3a2a1e', eyes: 8, eyeHex: '#5a3d22', mouth: 0, beard: 3, outfit: 0, shirtHex: '#2f5d50' } },
  // --- gwiazdy światowe ---
  { id: 'mrbeast', group: 'world', name: 'MrBeast', avatar: { skinHex: '#f1c9a5', hair: 10, hairHex: '#5a3a22', eyes: 8, eyeHex: '#5a3d22', mouth: 8, beard: 4, outfit: 6, shirtHex: '#2ba6c9' } },
  { id: 'musk', group: 'world', name: 'Elon Musk', avatar: { skinHex: '#f6d3b8', hair: 10, hairHex: '#3a2a1e', eyes: 8, eyeHex: '#6b7d6a', mouth: 7, outfit: 0, shirtHex: '#1c1c1f' } },
  { id: 'rock', group: 'world', name: 'The Rock', avatar: { skinHex: '#a9764c', hair: 0, hairColor: 0, eyes: 8, eyeHex: '#4a2f1a', mouth: 7, outfit: 0, shirtHex: '#22222a' } },
  { id: 'keanu', group: 'world', name: 'Keanu Reeves', avatar: { skinHex: '#f1c9a5', hair: 8, hairColor: 0, eyes: 8, eyeHex: '#4a2f1a', mouth: 2, beard: 3, outfit: 3, shirtHex: '#22222a' } },
  { id: 'dicaprio', group: 'world', name: 'Leonardo DiCaprio', avatar: { skinHex: '#f6d3b8', hair: 16, hairHex: '#a8824a', eyes: 8, eyeHex: '#6f93b5', mouth: 7, beard: 4, outfit: 4, shirtHex: '#22222a' } },
  { id: 'zendaya', group: 'world', name: 'Zendaya', avatar: { skinHex: '#b98458', hair: 13, hairHex: '#3a2415', eyes: 8, eyeHex: '#4a2f1a', mouth: 0, lipHex: '#a8473a', outfit: 5, shirtHex: '#8a4fd6' } },
  { id: 'einstein', group: 'world', name: 'Albert Einstein', avatar: { skinHex: '#f1c9a5', hair: 18, hairColor: 7, eyes: 8, eyeHex: '#5a3d22', mouth: 4, beard: 1, outfit: 3, shirtHex: '#8a5a3c' } },
];
// w przeglądarce BOT_GALLERY jest zmienną globalną, a serwer wczytuje ten sam plik przez require
if (typeof module !== 'undefined') module.exports = BOT_GALLERY;
