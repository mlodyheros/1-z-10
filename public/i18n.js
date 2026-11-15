// Tłumaczenia interfejsu (PL / EN). Pytania i odpowiedzi są po polsku.
const I18N = {
  pl: {
    tagline: 'Quiz na żywo: odpowiadasz, wyznaczasz rywala, zostaje najlepszy.',
    yourName: 'Twoje imię', namePh: 'np. Ania', randomize: '🎲 Losuj ludka', createRoom: 'Stwórz pokój',
    orJoin: 'albo dołącz do znajomych', codePh: 'KOD', join: 'Dołącz', defaultName: 'Gracz',
    p_skin: 'Skóra', p_hair: 'Fryzura', p_hairColor: 'Kolor włosów', p_eyes: 'Oczy', p_mouth: 'Usta', p_beard: 'Zarost',
    p_glasses: 'Okulary', p_hat: 'Nakrycie głowy', p_shirt: 'Kolor ubrania', p_outfit: 'Strój', prev: 'poprzedni', next: 'następny',
    codeLen: 'Kod pokoju ma 5 liter.', reconnecting: 'Utracono połączenie — łączę ponownie…',
    e_no_room: 'Nie ma pokoju o takim kodzie.', e_in_progress: 'Gra w tym pokoju już trwa. Poczekaj na następną rundę.',
    e_full: 'Pokój jest pełny (10 osób).', e_session: 'Sesja wygasła.', e_kicked: 'Gospodarz usunął Cię z pokoju.',
    e_need2: 'Potrzeba co najmniej 2 uczestników — zaproś znajomego albo dodaj bota.', e_need_cat: 'Wybierz przynajmniej jedną kategorię.',
    leave: 'Wyjdź', leaveGame: 'Wyjdź z gry', sure: 'Na pewno? Kliknij jeszcze raz', fs: 'Pełny ekran', fsExit: 'Zamknij pełny ekran', players: 'Uczestnicy', bot: 'bot', host: 'gospodarz', seat: 'stanowisko {n}', remove: 'Usuń {name}',
    lv_slaby: 'mega słaby', lv_latwy: 'łatwy', lv_sredni: 'średni', lv_trudny: 'trudny', lv_mistrz: 'mega dobry', gallery: 'Galeria botów', galHint: 'Wybierz poziom, potem kliknij postać, żeby dodać ją do gry.', g_friends: 'Znajomi', g_sport: 'Sport', g_music: 'Muzyka', g_world: 'Gwiazdy światowe', level: 'Poziom', close: 'Zamknij', inRoom: 'w grze', botLevelOf: 'Poziom bota {name}', botLv: 'Bot {lv}', addBot: '+ Dodaj bota',
    emotes: 'Emotki', em0: 'Machanie', em1: 'Dab', em2: 'Śmiech', em3: 'Podskok', em4: 'Płacz', em5: 'Strach', em6: 'Taniec', em7: 'Brawa', wheelHint: 'wybierz emotkę', free: 'wolne', yourChar: 'Twój ludek', onAir: 'NA ŻYWO',
    invite: 'Zaproś znajomych', roomCode: 'Kod pokoju', copyLink: 'Kopiuj link', linkCopied: 'Link skopiowany — wyślij go znajomym.',
    settings: 'Ustawienia', hostSets: 'ustawia gospodarz', answerTime: 'Czas na odpowiedź', finalQs: 'Pytań w finale',
    catsSummary: 'Kategorie: {a}/{b} · {q} pytań', all: 'Zaznacz wszystkie', none: 'Odznacz wszystkie', start: 'Rozpocznij grę',
    need2hint: 'Zaproś znajomego albo dodaj bota — potrzeba co najmniej 2 uczestników.', waitHost: 'Czekamy, aż gospodarz rozpocznie grę…',
    qLang: '',
    s1: 'Etap 1 — Rozgrzewka', s1d: 'Każdy dostaje dwa pytania. Każdy błąd kosztuje jedną szansę — nikt jeszcze nie odpada.',
    s2: 'Etap 2 — Wyznaczanie', s2d: 'Dobra odpowiedź daje prawo wskazania, kto odpowiada następny. Gramy, aż zostanie trójka.',
    s3: 'Finał', s3d: 'Pytania dla wszystkich — kto pierwszy się zgłosi, ten odpowiada. 10 pkt za odpowiedź, po trzech trafieniach wyznaczasz lub bierzesz pytanie na siebie za 20 pkt. Ostatni gracz gra dalej sam, aż skończą się pytania albo szanse.',
    left: 'pozostało pytań: {n}', room: 'pokój {c}', sound: 'Dźwięk', yourTurn: 'Twoja kolej!', answering: 'Odpowiada:', for20: ' · pytanie za 20 pkt',
    ansPh: 'Wpisz odpowiedź…', submit: 'Odpowiadam', typoHint: 'Drobne literówki są wybaczane. Pusta odpowiedź = „nie wiem”.',
    buzz: 'Zgłaszam się!', space: 'spacja', whoFirst: 'Kto zgłosi się pierwszy?', good: '✓ Dobrze!', bad: '✗ Źle', noAnswer: '(brak odpowiedzi)',
    nobody: 'Nikt się nie zgłosił', correct: 'Poprawna odpowiedź:', pts: 'pkt', out: '{name} odpada z gry', chances: 'Szanse: {n}',
    pick: 'Wskaż, kto odpowiada na następne pytanie', self20: 'Biorę na siebie (20 pkt)', picking: 'wybiera, kto odpowie na następne pytanie…',
    wins: '🏆 Wygrywa {name}!', eliminated: 'odpadł(a)', backLobby: 'Wróć do poczekalni', hostAgain: 'Gospodarz może rozpocząć kolejną grę.', offline: 'offline',
  },
  en: {
    tagline: 'Live quiz: answer, pick your rival, last one standing wins.',
    yourName: 'Your name', namePh: 'e.g. Anna', randomize: '🎲 Randomize character', createRoom: 'Create room',
    orJoin: 'or join your friends', codePh: 'CODE', join: 'Join', defaultName: 'Player',
    p_skin: 'Skin', p_hair: 'Hairstyle', p_hairColor: 'Hair colour', p_eyes: 'Eyes', p_mouth: 'Mouth', p_beard: 'Facial hair',
    p_glasses: 'Glasses', p_hat: 'Headwear', p_shirt: 'Outfit colour', p_outfit: 'Outfit', prev: 'previous', next: 'next',
    codeLen: 'A room code has 5 letters.', reconnecting: 'Connection lost — reconnecting…',
    e_no_room: 'No room with that code.', e_in_progress: 'A game is already running in this room. Wait for the next round.',
    e_full: 'The room is full (10 people).', e_session: 'Session expired.', e_kicked: 'The host removed you from the room.',
    e_need2: 'You need at least 2 participants — invite a friend or add a bot.', e_need_cat: 'Pick at least one category.',
    leave: 'Leave', leaveGame: 'Leave game', sure: 'Sure? Click again', fs: 'Full screen', fsExit: 'Exit full screen', players: 'Players', bot: 'bot', host: 'host', seat: 'podium {n}', remove: 'Remove {name}',
    lv_slaby: 'super weak', lv_latwy: 'easy', lv_sredni: 'medium', lv_trudny: 'hard', lv_mistrz: 'super strong', gallery: 'Bot gallery', galHint: 'Pick a level, then click a character to add it to the game.', g_friends: 'Friends', g_sport: 'Sports', g_music: 'Music', g_world: 'World stars', level: 'Level', close: 'Close', inRoom: 'in game', botLevelOf: 'Level of bot {name}', botLv: 'Bot: {lv}', addBot: '+ Add bot',
    emotes: 'Emotes', em0: 'Wave', em1: 'Dab', em2: 'Laugh', em3: 'Jump', em4: 'Cry', em5: 'Fear', em6: 'Dance', em7: 'Clap', wheelHint: 'pick an emote', free: 'free', yourChar: 'Your character', onAir: 'ON AIR',
    invite: 'Invite friends', roomCode: 'Room code', copyLink: 'Copy link', linkCopied: 'Link copied — send it to your friends.',
    settings: 'Settings', hostSets: 'set by the host', answerTime: 'Time to answer', finalQs: 'Final questions',
    catsSummary: 'Categories: {a}/{b} · {q} questions', all: 'Select all', none: 'Clear all', start: 'Start game',
    need2hint: 'Invite a friend or add a bot — you need at least 2 participants.', waitHost: 'Waiting for the host to start the game…',
    qLang: 'Questions and answers are in Polish.',
    s1: 'Stage 1 — Warm-up', s1d: 'Everyone gets two questions. Each mistake costs one chance — nobody is out yet.',
    s2: 'Stage 2 — Nominations', s2d: 'A correct answer lets you pick who answers next. We play until three are left.',
    s3: 'Final', s3d: 'Questions for everyone — first to buzz in answers. 10 pts per answer; after three hits you nominate or take the question yourself for 20 pts. The last player keeps playing alone until the questions or chances run out.',
    left: 'questions left: {n}', room: 'room {c}', sound: 'Sound', yourTurn: 'Your turn!', answering: 'Answering:', for20: ' · 20-point question',
    ansPh: 'Type your answer…', submit: 'Answer', typoHint: 'Small typos are forgiven. An empty answer means “I don’t know”.',
    buzz: 'Buzz in!', space: 'space', whoFirst: 'Who will buzz in first?', good: '✓ Correct!', bad: '✗ Wrong', noAnswer: '(no answer)',
    nobody: 'Nobody buzzed in', correct: 'Correct answer:', pts: 'pts', out: '{name} is out', chances: 'Chances: {n}',
    pick: 'Pick who answers the next question', self20: 'I’ll take it (20 pts)', picking: 'is picking who answers next…',
    wins: '🏆 {name} wins!', eliminated: 'out', backLobby: 'Back to lobby', hostAgain: 'The host can start another game.', offline: 'offline',
  },
};
const EMOTE_N = 8; // 0 machanie, 1 dab, 2 śmiech, 3 podskok, 4 płacz, 5 strach, 6 taniec, 7 brawa
let LANG = 'pl';
try { LANG = localStorage.getItem('ts-lang') === 'en' ? 'en' : 'pl'; } catch {}
function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]);
  if (s == null) s = I18N.pl[key] != null ? I18N.pl[key] : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
