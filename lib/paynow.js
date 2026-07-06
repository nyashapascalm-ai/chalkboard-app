import crypto from 'crypto';
const BASE = 'https://www.paynow.co.zw/interface';
function makeHash(values, key) {
  const s = values.join('') + key;
  return crypto.createHash('sha512').update(s, 'utf8').digest('hex').toUpperCase();
}
export async function initiate({ id, key, authemail, reference, amount, returnurl, resulturl, additionalinfo }) {
  const fields = { id, reference, amount: Number(amount).toFixed(2), additionalinfo: additionalinfo || '', returnurl, resulturl, authemail, status: 'Message' };
  const order = ['id', 'reference', 'amount', 'additionalinfo', 'returnurl', 'resulturl', 'authemail', 'status'];
  const hash = makeHash(order.map(k => fields[k]), key);
  const body = new URLSearchParams({ ...fields, hash });
  const res = await fetch(BASE + '/initiatetransaction', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const text = await res.text();
  return Object.fromEntries(new URLSearchParams(text));
}
export async function pollStatus(pollurl) {
  const res = await fetch(pollurl);
  const text = await res.text();
  return Object.fromEntries(new URLSearchParams(text));
}
