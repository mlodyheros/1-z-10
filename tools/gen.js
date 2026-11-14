'use strict';
// Generuje kategorie, które da się zbudować z tabel danych: stolice, chemia, matematyka.
// Uruchom: node tools/gen.js
const fs = require('fs');
const path = require('path');
const out = (id, name, lines) => {
  fs.writeFileSync(path.join(__dirname, '..', 'questions', id + '.txt'), '# ' + name + '\n' + lines.join('\n') + '\n');
  console.log(id, lines.length);
};

// ---------- Stolice i państwa ----------
const CAP = `Francja=Paryż;Niemcy=Berlin;Włochy=Rzym;Hiszpania=Madryt;Portugalia=Lizbona;Wielka Brytania/Zjednoczone Królestwo=Londyn;Irlandia=Dublin;Islandia=Reykjavik/Rejkiawik;Norwegia=Oslo;Szwecja=Sztokholm;Finlandia=Helsinki;Dania=Kopenhaga;Holandia/Niderlandy=Amsterdam;Belgia=Bruksela;Szwajcaria=Berno;Austria=Wiedeń;Czechy=Praga;Słowacja=Bratysława;Węgry=Budapeszt;Rumunia=Bukareszt;Bułgaria=Sofia;Grecja=Ateny;Turcja=Ankara;Ukraina=Kijów;Białoruś=Mińsk;Litwa=Wilno;Łotwa=Ryga;Estonia=Tallin;Rosja=Moskwa;Chorwacja=Zagrzeb;Słowenia=Lublana;Serbia=Belgrad;Bośnia i Hercegowina/Bośnia=Sarajewo;Czarnogóra=Podgorica;Albania=Tirana;Macedonia Północna/Macedonia=Skopje;Mołdawia=Kiszyniów;Malta=Valletta;Cypr=Nikozja;Polska=Warszawa;Gruzja=Tbilisi;Armenia=Erywań;Azerbejdżan=Baku;Kazachstan=Astana;Uzbekistan=Taszkent;Kirgistan=Biszkek;Tadżykistan=Duszanbe;Turkmenistan=Aszchabad;Chiny=Pekin;Japonia=Tokio;Korea Południowa=Seul;Korea Północna=Pjongjang/Phenian;Mongolia=Ułan Bator;Indie=Nowe Delhi/Delhi;Pakistan=Islamabad;Bangladesz=Dhaka/Dakka;Nepal=Katmandu;Afganistan=Kabul;Iran=Teheran;Irak=Bagdad;Syria=Damaszek;Liban=Bejrut;Jordania=Amman;Arabia Saudyjska=Rijad;Zjednoczone Emiraty Arabskie/ZEA/Emiraty=Abu Zabi/Abu Dhabi;Katar=Doha/Ad-Dauha;Oman=Maskat;Jemen=Sana;Bahrajn=Manama;Tajlandia=Bangkok;Wietnam=Hanoi;Kambodża=Phnom Penh;Laos=Wientian;Malezja=Kuala Lumpur;Indonezja=Dżakarta;Filipiny=Manila;Australia=Canberra;Nowa Zelandia=Wellington;Fidżi=Suva;Egipt=Kair;Libia=Trypolis;Algieria=Algier;Maroko=Rabat;Etiopia=Addis Abeba;Kenia=Nairobi;Nigeria=Abudża;Ghana=Akra;Senegal=Dakar;Angola=Luanda;Zimbabwe=Harare;Madagaskar=Antananarywa;Somalia=Mogadiszu;Sudan=Chartum;Uganda=Kampala;Demokratyczna Republika Konga/DRK/Kongo=Kinszasa;Tanzania=Dodoma;Zambia=Lusaka;Mozambik=Maputo;Namibia=Windhuk;Botswana=Gaborone;Rwanda=Kigali;Mali=Bamako;Kanada=Ottawa;Stany Zjednoczone/USA=Waszyngton/Washington;Kuba=Hawana;Jamajka=Kingston;Haiti=Port-au-Prince;Dominikana=Santo Domingo;Nikaragua=Managua;Honduras=Tegucigalpa;Kostaryka=San José;Kolumbia=Bogota;Wenezuela=Caracas;Peru=Lima;Chile=Santiago;Argentyna=Buenos Aires;Urugwaj=Montevideo;Paragwaj=Asunción;Brazylia=Brasília;Ekwador=Quito;Liechtenstein=Vaduz`;
const cap = [];
for (const pair of CAP.split(';')) {
  const [c, k] = pair.split('=').map(s => s.split('/'));
  cap.push(`Jakie miasto jest stolicą państwa: ${c[0]}?|${k.join('|')}`);
  cap.push(`Stolicą którego państwa jest ${k[0]}?|${c.join('|')}`);
}
out('stolice-i-panstwa', 'Stolice i państwa', cap);

// ---------- Chemia ----------
const EL = `H=wodór;He=hel;Li=lit;Be=beryl;B=bor;C=węgiel;N=azot;O=tlen;F=fluor;Ne=neon;Na=sód;Mg=magnez;Al=glin/aluminium;Si=krzem;P=fosfor;S=siarka;Cl=chlor;Ar=argon;K=potas;Ca=wapń;Ti=tytan;Cr=chrom;Mn=mangan;Fe=żelazo;Co=kobalt;Ni=nikiel;Cu=miedź;Zn=cynk;As=arsen;Br=brom;Kr=krypton;Sr=stront;Ag=srebro;Sn=cyna;I=jod;Xe=ksenon;Ba=bar;W=wolfram;Pt=platyna;Au=złoto;Hg=rtęć;Pb=ołów;Rn=radon;Ra=rad;U=uran;Pu=pluton;Bi=bizmut;Cs=cez;Sb=antymon;Se=selen`;
const chem = [];
for (const pair of EL.split(';')) {
  const [sym, names] = pair.split('=');
  const n = names.split('/');
  chem.push(`Jaki pierwiastek ma symbol chemiczny ${sym}?|${n.join('|')}`);
  chem.push(`Podaj symbol chemiczny pierwiastka: ${n[0]}.|${sym}`);
}
chem.push(...`Jaki jest wzór chemiczny wody?|H2O
Jaki jest wzór chemiczny dwutlenku węgla?|CO2
Jaki jest wzór chemiczny soli kuchennej?|NaCl
Jaki jest wzór chemiczny tlenu cząsteczkowego?|O2
Jaki jest wzór chemiczny ozonu?|O3
Jaki jest wzór chemiczny amoniaku?|NH3
Jaki jest wzór chemiczny metanu?|CH4
Jaki jest wzór chemiczny kwasu siarkowego(VI)?|H2SO4
Jaki jest wzór chemiczny kwasu solnego?|HCl
Jaki jest wzór chemiczny tlenku węgla, czyli czadu?|CO
Jaki jest wzór chemiczny wodorotlenku sodu?|NaOH
Jaki gaz stanowi około 78% powietrza?|azot
Jaki gaz jest niezbędny do spalania?|tlen
Jaki jest najlżejszy pierwiastek?|wodór
Jaki pierwiastek jest podstawą związków organicznych?|węgiel
Jak nazywa się najtwardsza naturalna odmiana węgla?|diament
Z jakiego pierwiastka zbudowany jest grafit?|węgiel|z węgla
Jaki metal jest ciekły w temperaturze pokojowej?|rtęć
Jakie pH ma roztwór obojętny?|7
Jaki odczyn ma roztwór o pH mniejszym od 7?|kwasowy|kwaśny
Jaki odczyn ma roztwór o pH większym od 7?|zasadowy
Kto stworzył układ okresowy pierwiastków?|Dmitrij Mendelejew
Jak nazywa się cząstka o ładunku ujemnym krążąca wokół jądra atomu?|elektron
Jak nazywa się cząstka o ładunku dodatnim w jądrze atomu?|proton
Jak nazywa się obojętna cząstka w jądrze atomu?|neutron
Jak nazywa się przejście ze stanu stałego bezpośrednio w gazowy?|sublimacja
Jak nazywa się przejście cieczy w gaz?|parowanie
Jak nazywa się przejście gazu w ciecz?|skraplanie|kondensacja
Jak nazywa się przejście cieczy w ciało stałe?|krzepnięcie
Jak nazywa się przejście ciała stałego w ciecz?|topnienie
Jak nazywa się substancja przyspieszająca reakcję chemiczną?|katalizator
Jaki wskaźnik barwi się na malinowo w zasadach?|fenoloftaleina
Jak nazywa się stop miedzi i cyny?|brąz
Jak nazywa się stop miedzi i cynku?|mosiądz
Jak nazywa się stop żelaza z węglem używany w budownictwie?|stal
Jaki gaz szlachetny wypełnia balony unoszące się w powietrzu?|hel
Jaki pierwiastek odkryła Maria Skłodowska-Curie i nazwała na cześć Polski?|polon
Jaki drugi pierwiastek, obok polonu, odkryli małżonkowie Curie?|rad
Jaki kwas znajduje się w żołądku człowieka?|solny|kwas solny|chlorowodorowy
Jaki kwas znajduje się w occie?|octowy|kwas octowy
Jaki kwas nadaje kwaśny smak cytrynie?|cytrynowy|kwas cytrynowy
Jak potocznie nazywa się stały dwutlenek węgla?|suchy lód
Jaki gaz powstaje podczas fotosyntezy?|tlen
Jaki gaz jest głównym składnikiem gazu ziemnego?|metan
Jak nazywa się proces powlekania stali cynkiem?|cynkowanie
Jak nazywa się niszczenie metali pod wpływem otoczenia?|korozja
Jaki pierwiastek dodaje się do soli kuchennej, by zapobiegać chorobom tarczycy?|jod
Jaki pierwiastek jest głównym składnikiem piasku obok tlenu?|krzem
Ile wynosi liczba atomowa wodoru?|1
Ile wynosi liczba atomowa węgla?|6
Ile wynosi liczba atomowa tlenu?|8
Ile atomów wodoru zawiera cząsteczka wody?|2
Jak nazywa się reakcja kwasu z zasadą?|zobojętnianie|neutralizacja
Jak nazywają się atomy tego samego pierwiastka różniące się liczbą neutronów?|izotopy
Jak nazywa się nauka o związkach węgla?|chemia organiczna
Jaki alkohol znajduje się w napojach alkoholowych?|etanol|alkohol etylowy
Jaki cukier prosty jest podstawowym źródłem energii dla komórek?|glukoza
Jak nazywa się cukier występujący w mleku?|laktoza
Jak chemicy nazywają cukier stołowy?|sacharoza
Jaki metal szlachetny ma najwyższą przewodność elektryczną?|srebro`.split('\n'));
out('chemia', 'Chemia', chem);

// ---------- Matematyka ----------
const mat = [];
for (let n = 11; n <= 25; n++) mat.push(`Ile wynosi ${n} do kwadratu?|${n * n}`);
for (const [a, b] of [[6, 7], [7, 8], [8, 9], [9, 6], [12, 7], [13, 6], [14, 5], [15, 8], [16, 4], [17, 3], [18, 6], [19, 5], [21, 4], [23, 3], [24, 5], [25, 8], [12, 12], [15, 15], [11, 13], [9, 14], [7, 16], [8, 17], [6, 19], [4, 27], [3, 37], [5, 44], [9, 25], [8, 35], [7, 45], [6, 55]]) mat.push(`Ile to ${a} × ${b}?|${a * b}`);
for (const [a, b] of [[47, 38], [125, 76], [89, 64], [256, 144], [73, 49], [199, 202], [58, 67], [345, 155]]) mat.push(`Ile to ${a} + ${b}?|${a + b}`);
for (const [a, b] of [[100, 37], [250, 86], [91, 47], [1000, 365], [144, 89], [500, 123], [72, 38]]) mat.push(`Ile to ${a} − ${b}?|${a - b}`);
for (const [p, n] of [[10, 250], [20, 150], [25, 80], [50, 46], [5, 200], [15, 60], [30, 90], [75, 40], [1, 500], [40, 250], [12, 50], [60, 150], [35, 200], [8, 25], [90, 30]]) mat.push(`Ile to ${p}% z liczby ${n}?|${p * n / 100}`);
for (let e = 3; e <= 12; e++) mat.push(`Ile wynosi 2 do potęgi ${e}?|${2 ** e}`);
for (const n of [36, 49, 64, 81, 121, 144, 169, 196, 225, 400]) mat.push(`Ile wynosi pierwiastek kwadratowy z ${n}?|${Math.sqrt(n)}`);
for (const [a, b] of [[144, 12], [96, 8], [225, 15], [132, 11], [91, 7], [108, 9], [256, 16], [75, 5]]) mat.push(`Ile to ${a} : ${b}?|${a / b}`);
mat.push(...`Ile stopni ma kąt prosty?|90
Ile stopni ma kąt pełny?|360
Ile stopni ma kąt półpełny?|180
Ile wynosi suma kątów w trójkącie?|180
Ile wynosi suma kątów w czworokącie?|360
Ile boków ma sześciokąt?|6
Ile boków ma ośmiokąt?|8
Ile ścian ma sześcian?|6
Ile wierzchołków ma sześcian?|8
Ile krawędzi ma sześcian?|12
Ile ścian ma czworościan?|4
Jak nazywa się najdłuższy bok trójkąta prostokątnego?|przeciwprostokątna
Jak nazywają się boki trójkąta prostokątnego tworzące kąt prosty?|przyprostokątne
Czyje twierdzenie mówi, że a² + b² = c² w trójkącie prostokątnym?|Pitagorasa|Pitagoras
Jak nazywa się trójkąt o trzech równych bokach?|równoboczny
Jak nazywa się trójkąt o dwóch równych bokach?|równoramienny
Jak nazywa się odcinek łączący środek okręgu z punktem na okręgu?|promień
Jak nazywa się najdłuższa cięciwa okręgu?|średnica
Jaką grecką literą oznacza się stosunek obwodu koła do średnicy?|pi
Ile wynosi liczba pi z dokładnością do dwóch miejsc po przecinku?|3,14|3.14
Jaka jest najmniejsza liczba pierwsza?|2
Jaka jest jedyna parzysta liczba pierwsza?|2
Jaka jest największa liczba pierwsza mniejsza od 20?|19
Ile wynosi silnia z 5?|120
Ile wynosi silnia z 4?|24
Ile wynosi silnia z zera?|1
Ile to jest tuzin?|12
Ile to jest kopa?|60
Ile to jest mendel?|15
Ile zer ma milion?|6
Ile zer ma miliard?|9
Jak zapisuje się liczbę 50 w systemie rzymskim?|L
Jak zapisuje się liczbę 100 w systemie rzymskim?|C
Jak zapisuje się liczbę 500 w systemie rzymskim?|D
Jak zapisuje się liczbę 1000 w systemie rzymskim?|M
Jaką liczbę oznacza rzymskie XIV?|14
Jaką liczbę oznacza rzymskie XL?|40
Jaką liczbę oznacza rzymskie XC?|90
Jaką liczbę oznacza rzymskie MM?|2000
Jak nazywa się wynik dodawania?|suma
Jak nazywa się wynik odejmowania?|różnica
Jak nazywa się wynik mnożenia?|iloczyn
Jak nazywa się wynik dzielenia?|iloraz
Jak nazywa się górna liczba w ułamku zwykłym?|licznik
Jak nazywa się dolna liczba w ułamku zwykłym?|mianownik
Jak nazywa się czworokąt o czterech równych bokach i kątach prostych?|kwadrat
Jak nazywa się czworokąt o czterech równych bokach, niekoniecznie z kątami prostymi?|romb
Jak nazywa się czworokąt mający co najmniej jedną parę boków równoległych?|trapez
Jak nazywa się wielokąt o pięciu bokach?|pięciokąt
Jak nazywa się bryła, której wszystkie punkty powierzchni są równo oddalone od środka?|kula
Jak nazywa się kąt mniejszy od 90 stopni?|ostry
Jak nazywa się kąt większy od 90, a mniejszy od 180 stopni?|rozwarty
Ile centymetrów ma metr?|100
Ile metrów ma kilometr?|1000
Ile gramów ma kilogram?|1000
Ile kilogramów ma tona?|1000
Ile mililitrów ma litr?|1000
Ile sekund ma godzina?|3600
Ile minut ma doba?|1440
Ile metrów kwadratowych ma hektar?|10000
Jak nazywa się średnia otrzymana przez podzielenie sumy liczb przez ich ilość?|arytmetyczna|średnia arytmetyczna
Jak nazywa się środkowa wartość w uporządkowanym zbiorze liczb?|mediana
Który starożytny Grek napisał „Elementy”, podstawowe dzieło geometrii?|Euklides
Jak nazywa się ciąg, w którym każda liczba jest sumą dwóch poprzednich?|Fibonacciego|ciąg Fibonacciego
Ile wynosi 1/4 zapisana jako procent?|25
Ile wynosi 0,5 zapisane jako ułamek zwykły o mianowniku 2 — podaj licznik.|1
Jaki jest najmniejszy wspólny mianownik ułamków 1/2 i 1/3?|6
Ile wynosi największy wspólny dzielnik liczb 12 i 18?|6
Ile wynosi najmniejsza wspólna wielokrotność liczb 4 i 6?|12
Ile przekątnych ma kwadrat?|2
Ile osi symetrii ma kwadrat?|4`.split('\n'));
out('matematyka', 'Matematyka', mat);
