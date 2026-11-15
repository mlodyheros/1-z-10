# Trzy Szanse

Quiz na żywo dla 2–10 osób: znajomi i/lub boty. Każdy ma trzy szanse, dobra odpowiedź pozwala wyznaczyć kolejną osobę, a najlepsza trójka gra w finale na punkty.

## Uruchomienie

```bash
npm install
npm start
```

Gra działa pod adresem http://localhost:3110 (port można zmienić zmienną `PORT`).

## Jak grać ze znajomymi

1. Ustaw imię i ludka, kliknij **Stwórz pokój**.
2. Wyślij znajomym kod pokoju albo link (`/?pokoj=KOD`). Możesz też dodać boty (łatwy / średni / trudny).
3. Gospodarz wybiera kategorie, czas na odpowiedź i długość finału, po czym startuje grę.

Żeby znajomi spoza Twojej sieci mogli wejść, serwer musi być dostępny z internetu (hosting obsługujący Node.js i WebSocket albo tunel do `localhost:3110`).

W poczekalni i przy stanowisku można puszczać emotki: przycisk „Emotki” (albo klawisz B) otwiera koło z pozami ludka — machanie, dab, śmiech, podskok, płacz, strach, taniec, brawa. Interfejs ma przełącznik PL/EN; pytania są po polsku.

## Zasady

- **Etap 1 — Rozgrzewka:** każdy dostaje dwa pytania. Każdy błąd to utrata jednej szansy — w rozgrzewce nikt nie odpada.
- **Etap 2 — Wyznaczanie:** kto odpowie dobrze, wskazuje następną osobę. Trwa, aż zostanie trójka.
- **Finał:** pytania do wszystkich, odpowiada ten, kto pierwszy się zgłosi (10 pkt). Po trzech trafieniach gracz wyznacza odpowiadającego albo bierze pytanie na siebie za 20 pkt. Jeśli zostanie jedna osoba, gra dalej sama, aż skończą się pytania albo jej szanse. Na koniec każda zachowana szansa daje 10 pkt.

Odpowiedzi wpisuje się z klawiatury. Drobne literówki, brak polskich znaków, samo nazwisko zamiast imienia i nazwiska są akceptowane (`match.js`). Zaliczane są też inne formy tego samego słowa (np. *ghostowanie* dla *ghosting*, *Francji* dla *Francja*) oraz odpowiedzi po angielsku (*Germany*, *oxygen*) — słownik w `en.js`.

## Pytania

`questions/*.txt` — jedna kategoria na plik, pierwsza linia `# Nazwa`, potem `Pytanie?|odpowiedź|alternatywna odpowiedź`. Nowy plik = nowa kategoria (po restarcie serwera). Kategorie „Stolice i państwa”, „Chemia” i „Matematyka” generuje `npm run gen`.

`npm run sim` rozgrywa testową grę samych botów na działającym serwerze.
