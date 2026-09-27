# Sala riunioni in realtà aumentata — versione semplificata

Il partecipante inquadra il QR della sua postazione: si apre una pagina web (nessuna app), il telefono chiede il permesso per la fotocamera e, continuando a inquadrare lo stesso codice, sopra il segnaposto compaiono:

1. **il logo**, uguale per tutti;
2. **il nome del partecipante**, più piccolo, che dipende dal QR inquadrato;
3. **la scritta principale**, uguale per tutti.

Logo e scritta si cambiano in diretta dalla pagina di regia. I QR non cambiano mai: identificano solo il numero di postazione, quindi si stampano una volta sola.

## Cosa c'è nella cartella

- `index.html`: la pagina che si apre sui telefoni.
- `regia.html`: da qui cambi scritta e logo per tutti e vedi chi è collegato.
- `stampa.html`: genera i segnaposto con i QR.
- `config.js`: nomi dei partecipanti, scritta e logo di partenza.
- `logo.png`: logo di partenza (quello incluso è un segnaposto, sostituiscilo).

## 1. Prepara

1. In `config.js` cambia `stanza` con una sequenza tua, difficile da indovinare.
2. Sempre in `config.js`, scrivi i nomi per ogni postazione.
3. Sostituisci `logo.png` con il vostro logo, meglio in PNG con sfondo trasparente.

## 2. Pubblica su un indirizzo https

La fotocamera si attiva solo su siti https. Il modo più rapido è **app.netlify.com/drop**: trascini la cartella e ottieni subito un indirizzo. In alternativa va bene un vostro server web con certificato.

## 3. Stampa i segnaposto

Apri `https://<tuo-indirizzo>/stampa.html` e stampa (A4, scala 100%) su cartoncino **opaco**. Sul segnaposto compare solo il numero, così resta valido anche se cambiano i nomi. Per una prova veloce puoi inquadrare i codici direttamente sullo schermo del portatile.

## 4. Durante l'incontro

1. Apri `regia.html` sul tuo telefono o portatile e attendi il pallino dorato.
2. Scrivi la scritta, scegli eventualmente un altro logo, controlla l'anteprima e premi **Mostra a tutti**.
3. I telefoni si aggiornano subito, anche quelli che si collegano dopo. Ogni cambio fa ripartire l'animazione di comparsa.
4. Nella parte destra vedi chi è collegato e chi sta guardando.

Per cambiare un nome: modifica `config.js` e ripubblica la cartella. I QR restano gli stessi.

## Consigli

- Illumina bene e in modo uniforme il piano del tavolo.
- Inquadra da 30-60 cm, con tutto il codice nell'inquadratura.
- Apri il link in Safari (iPhone) o Chrome (Android): alcuni lettori QR usano un browser interno che blocca la fotocamera.
- Se le scritte non si aggiornano e il pallino sul telefono è rosso, la rete blocca il server di sincronizzazione (porta 8884): prova con la rete mobile. In ogni caso il telefono mostra la scritta e il logo di `config.js`.

## Limiti del prototipo

Il server di sincronizzazione è pubblico e gratuito, adatto alle demo. Per l'uso stabile basta un broker MQTT vostro (es. Mosquitto con websocket e certificato), da indicare nel campo `broker` di `config.js`.
