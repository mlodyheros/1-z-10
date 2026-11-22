#!/bin/bash
# Generuje promo/trzy-szanse-rolka.mp4. Wymaga: macOS (say, głos Zosia), Google Chrome, ffmpeg.
set -e; cd "$(dirname "$0")"; W=$(mktemp -d)
i=0; while IFS= read -r line; do i=$((i+1)); say -v Zosia -r 215 -o $W/v$i.aiff "$line"; done <<'T'
Masz trzy szanse. Spoiler: zmarnujesz wszystkie.
Robisz ludka. Wyglądasz jak wujek na weselu. Idealnie.
Wysyłasz kod ekipie. Ktoś już obiecał pizzę.
Wjeżdżasz do studia.
Stolica Australii? Kuba, pewny siebie:
Sidnej!
Kuba. Nie.
Dobra odpowiedź? To ty wybierasz ofiarę.
Finał! Kto pierwszy, ten lepszy.
Wygrywasz. Kuba płacze. Kuba stawia pizzę.
Trzy Szanse. Zagraj ze znajomymi. Za darmo.
T
ffmpeg -v error -y -i $W/v6.aiff -af "asetrate=22050*0.78,aresample=44100,volume=1.6" $W/v6k.wav
D=(200 3750 7300 10250 12700 15350 16150 17300 20150 22750 25950); IN=""; F=""; M=""
for k in $(seq 1 11); do f=$W/v$k.aiff; [ $k = 6 ] && f=$W/v6k.wav; IN="$IN -i $f"; F="$F[$((k-1))]adelay=${D[$((k-1))]}:all=1[a$k];"; M="$M[a$k]"; done
ffmpeg -v error -y $IN -filter_complex "${F}${M}amix=inputs=11:normalize=0,aresample=44100,apad=whole_dur=29.4,atrim=0:29.4[vo]" -map "[vo]" -ac 1 $W/vo.wav
node synth.js && mv music.wav sfx.wav $W/
ffmpeg -v error -y -i $W/vo.wav -i $W/music.wav -i $W/sfx.wav -filter_complex "[0]highpass=f=90,acompressor=threshold=-20dB:ratio=3:makeup=4dB,volume=1.5,asplit[v1][v2];[1]volume=0.55[m];[m][v2]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=250[md];[v1][md][2]amix=inputs=3:normalize=0,alimiter=limit=0.9[out]" -map "[out]" -ar 48000 -ac 2 $W/mix.wav
node serve.js & SP=$!; sleep 0.5
node capture.js $W/frames 30; kill $SP
ffmpeg -v error -y -framerate 30 -i $W/frames/%05d.jpg -i $W/mix.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart ../trzy-szanse-rolka.mp4
rm -rf $W; echo "gotowe: promo/trzy-szanse-rolka.mp4"
