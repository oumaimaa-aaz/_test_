/* =========================================================================
   js/config.js  —  the ONLY line you need to edit after deploying Code.gs
   Paste the web app URL (it ends with /exec) between the quotes.
   ========================================================================= */
const SCRIPT_URL='https://script.google.com/macros/s/AKfycbzlj75w4ctlkIJDzV0Egb95pWUNXD1Sjl7gG6PCBRp-g56W2GkDkKdAV1BDhONhPagFsA/exec';

/* =========================================================================
   Statistiques et publicité (cookies)
   Ces deux outils ne se chargent QU'APRÈS le consentement du visiteur
   (voir js/cookies.js). Laissez les guillemets vides tant que vous n'avez
   pas de compte : rien ne sera chargé ni déclaré dans la fenêtre de cookies.
   ========================================================================= */
const GA_ID='';          // Google Analytics 4, ex. 'G-ABC123XYZ9'
const META_PIXEL_ID='';  // Meta Pixel, ex. '123456789012345'

/* Registre des consentements : chaque choix (accepter / refuser / personnaliser) est ajouté,
   de façon anonyme, dans l'onglet « Consentements » de votre Google Sheet.
   Mettez false pour désactiver. Il faut avoir redéployé la dernière version de Code.gs. */
const CONSENT_LOG=true;
