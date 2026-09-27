// =====================================================================
//  CONFIGURAZIONE DELLA SALA — l'unico file da modificare
// =====================================================================
window.SALA_CONFIG = {

  // Codice della sala: cambialo con una sequenza tua, lunga e difficile da indovinare.
  // Telefoni e regia con lo stesso codice restano sincronizzati.
  stanza: "cambiami-7Qx4vR2m",

  // Server che sincronizza i telefoni con la regia (pubblico, adatto alle demo).
  broker: "wss://broker.hivemq.com:8884/mqtt",

  // Contenuti di partenza. Durante l'incontro li cambi dalla pagina regia.html
  // senza ristampare i QR code.
  testo: "Benvenuti nel nostro futuro",
  logo: "logo.png",   // sostituisci il file logo.png (meglio PNG con sfondo trasparente)

  // Una riga per postazione. La chiave ("01", "02"…) è quella stampata nel QR.
  postazioni: {
    "01": { nome: "Sandro" },
    "02": { nome: "Ospite 2" },
    "03": { nome: "Ospite 3" },
    "04": { nome: "Ospite 4" },
    "05": { nome: "Ospite 5" },
    "06": { nome: "Ospite 6" },
    "07": { nome: "Ospite 7" },
    "08": { nome: "Ospite 8" },
  },
};
