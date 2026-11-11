/**
 * Het script dat in elke pagina van de webview draait, vóór de pagina zelf.
 *
 * Het doet twee dingen die de app niet van buitenaf kan zien:
 *
 *  1. **Melden waar de cursist is en of er een sessie is.** Next navigeert met `pushState`, en
 *     daar krijgt de webview geen laad-event van. De sessie staat in de cookie van Supabase
 *     (`sb-…-auth-token`, niet httpOnly); is die weg, dan toont de app zijn inlogscherm.
 *  2. **Kooplinks tegenhouden** voordat de router van de site ze oppakt. Zie `isPurchaseUrl`.
 *
 * Het script verandert niets aan de DOM vóór React hydrateert: een attribuut op `<html>` zetten
 * geeft een hydratatiefout (gezien in de dev-overlay van Next). De site kan de app herkennen aan
 * de user-agent: `InburgeringOefenenApp/1.0`.
 *
 * Het is een string omdat het in de pagina wordt uitgevoerd, niet in de app.
 */
export type BridgeMessage =
  | { type: 'nav'; path: string; auth: boolean }
  | { type: 'purchase' };

export const BRIDGE_SCRIPT = `
(function () {
  if (window.__ioShell) return;
  window.__ioShell = true;

  var PURCHASE = /\\/dashboard\\/pakketten(\\/|$)|\\/premium(\\/|$)|\\/betaling-gelukt(\\/|$)|\\/%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2%D8%A9/;

  function post(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  function report() {
    post({
      type: 'nav',
      path: location.pathname,
      auth: /(^|;\\s*)sb-[^=;]*-auth-token(\\.0)?=/.test(document.cookie),
    });
  }

  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name];
    history[name] = function () {
      var result = original.apply(this, arguments);
      setTimeout(report, 0);
      return result;
    };
  });
  window.addEventListener('popstate', report);
  window.addEventListener('pageshow', report);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) report();
  });

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var url;
    try { url = new URL(link.href, location.href); } catch (e) { return; }
    if (PURCHASE.test(url.pathname)) {
      event.preventDefault();
      event.stopPropagation();
      post({ type: 'purchase' });
    }
  }, true);

  report();
})();
true;
`;
