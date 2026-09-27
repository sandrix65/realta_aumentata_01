// =====================================================================
//  CONFIGURAZIONE DELLA SALA — l'unico file da modificare
// =====================================================================
window.SALA_CONFIG = {

  // Codice della sala: cambialo con una sequenza tua, lunga e difficile da indovinare.
  // Telefoni e regia con lo stesso codice restano sincronizzati.
  stanza: "Villa Alba",

  // Server che sincronizza i telefoni con la regia (pubblico, adatto alle demo).
  broker: "wss://broker.hivemq.com:8884/mqtt",

  // Contenuti di partenza. Durante l'incontro li cambi dalla pagina regia.html
  // senza ristampare i QR code.
  testo: "Benvenuto sul confine della nostra magione",
  logo: "logo.png",   // sostituisci il file logo.png (meglio PNG con sfondo trasparente)

  // Aspetto delle scritte in realtà aumentata
  aspetto: {
    coloreScritta: "#000000",   // colore della scritta principale (nero)
    coloreNome: "#000000",      // colore del nome del partecipante (nero)
    contorno: "#FFFFFF",        // bordo attorno alle lettere, le rende leggibili su ogni sfondo ("" per toglierlo)
    grandezzaScritta: 1.5,      // 1 = dimensione originale, 1.5 = più grande del 50%, 2 = doppia
    grandezzaNome: 1.5,
    grandezzaLogo: 1,
  },

  // Una riga per postazione. La chiave ("01", "02"…) è quella stampata nel QR.
  postazioni: {
    "01": { nome: "Viandante" },
    "02": { nome: "Ospite 2" },
    "03": { nome: "Ospite 3" },
    "04": { nome: "Ospite 4" },
    "05": { nome: "Ospite 5" },
    "06": { nome: "Ospite 6" },
    "07": { nome: "Ospite 7" },
    "08": { nome: "Ospite 8" },
  },
};
