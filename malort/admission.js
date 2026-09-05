(() => {
  const el = id => document.getElementById(id);
  let session = '';
  try { session = decodeURIComponent(location.hash.slice(1)); } catch {}
  const valid = /^cs_(test_|live_)?[A-Za-z0-9]{1,240}$/.test(session);
  let code = '', loading = false;
  const show = (title, message) => { el('title').textContent = title; el('message').textContent = message; };
  async function check() {
    if (loading) return;
    if (!valid) {
      show('Receipt link incomplete', 'Open the receipt link from checkout. If you need help, contact support with your Stripe receipt. Do not pay again.');
      return;
    }
    loading = true;
    el('retry').hidden = false;
    el('retry').disabled = true;
    show('Confirming your admission', 'Please wait while we verify your payment.');
    try {
      const response = await fetch('https://hvxbhxsjjnurkvxoyqob.supabase.co/functions/v1/buy_in?session_id=' + encodeURIComponent(session), {
        headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        show('Admission not yet confirmed', response.status === 429
          ? 'Please wait a minute before checking again. Do not pay again. Contact support if you need help.'
          : 'Your payment may still be processing, or this admission could not be confirmed. Check again after it settles. Do not pay again; contact support with your Stripe receipt if this continues.');
        return;
      }
      const body = await response.json();
      if (body.activated === true) {
        for (const id of ['code', 'copy', 'copy-status', 'legacy-note']) el(id).hidden = true;
        el('open').href = 'malortchampion://admission';
        el('open').textContent = 'Open Malört Champion';
        el('admission').hidden = false;
        el('retry').hidden = true;
        show('You’re a member', 'Your membership is active on the Apple account you used before checkout. Return to the app to enter the club. No code needed.');
        return;
      }
      if (!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{16}$/.test(body.code || '')) throw Error('invalid_receipt');
      code = body.code;
      el('code').textContent = code;
      el('open').href = './invite.html#' + encodeURIComponent(code);
      el('admission').hidden = false;
      el('retry').hidden = true;
      show('Your admission is ready', 'Continue to the app, confirm you’re 21+, and sign in with Apple to activate your membership.');
    } catch {
      show('Unable to check right now', 'Check your connection and try again. Do not pay again. Contact support with your Stripe receipt if this continues.');
    } finally { loading = false; el('retry').disabled = false; }
  }
  el('retry').addEventListener('click', check);
  el('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); el('copy-status').textContent = 'Code copied.'; }
    catch { el('copy-status').textContent = 'Select the code above to copy it.'; }
  });
  check();
})();
