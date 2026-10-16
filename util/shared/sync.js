/* SyncKit — 日記・カロリー記録で共有する「自分のFirebaseにつなぐ同期」の部品
   設定（firebaseConfig と合言葉）はこのドメインの localStorage に1つだけ保存し、どのツールからも同じものを使う。
   データの置き場：users/{uid}/{コレクション}/{id}（自分のFirebaseの中。本文は合言葉があれば暗号化） */
(() => {
'use strict';
const KEY = 'webemon.sync.v1', OLDKEY = 'diaryapp.sync', FBU = 'https://www.gstatic.com/firebasejs/10.12.2/';
const $ = id => document.getElementById(id);
const pad2 = n => String(n).padStart(2, '0');

let SY = (() => {
  try {
    const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.cfg) return j;
    const o = JSON.parse(localStorage.getItem(OLDKEY)); if (o && o.cfg) { localStorage.setItem(KEY, JSON.stringify(o)); return o; }   // 日記だけで設定済みの人を引き継ぐ
  } catch {}
  return {};
})();
const saveSY = () => { try { localStorage.setItem(KEY, JSON.stringify(SY)); } catch { flash('設定を保存できませんでした'); } };

let fb = null, user = null, ready = false, encMode = false, ckey = null, unsubs = [], chain = Promise.resolve(), readyCb = null, flashT = 0;

/* ---------- 表示 ---------- */
function sst(msg) { const e = $('sk-stat'); if (e) e.textContent = msg; }
function flash(msg) { const e = $('sk-flash'); if (!e) return; e.textContent = msg; clearTimeout(flashT); flashT = setTimeout(() => { e.textContent = ''; }, 4000); }
function syncUI() {
  const has = !!SY.cfg, h = (id, v) => { const e = $(id); if (e) e.classList.toggle('sk-hide', v); };
  h('sk-connect', has); h('sk-login', !(has && fb && !user)); h('sk-code', !has); h('sk-off', !has);
  document.querySelectorAll('#sk-root .sk-cfgonly').forEach(el => el.classList.toggle('sk-hide', has));
  const b = $('sk-badge'); if (b) b.textContent = ready ? '● 同期中' : (has ? '△ 未接続' : '');
}
function errMsg(e) {
  const c = (e && e.code) || '';
  if (/permission-denied/.test(c)) return 'データを読み書きできません。手順5のルールが「公開」されているか確認してください。';
  if (/unauthorized-domain/.test(c)) return 'このサイトのドメインが承認されていません。手順3を確認してください。';
  if (/popup-closed|cancelled-popup/.test(c)) return 'ログインが途中で閉じられました。';
  if (/popup-blocked/.test(c)) return 'ポップアップがブロックされました。許可してもう一度押してください。';
  if (/operation-not-allowed/.test(c)) return 'Googleログインが有効になっていません。手順2を確認してください。';
  if (/unavailable|network/.test(c)) return 'ネットワークにつながっていません。つながると自動で同期します。';
  return '同期でエラー：' + (c || (e && e.message) || e);
}
function done() { const d = new Date(); sst('同期中（' + (user && user.email || '') + '・最終 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '）' + (encMode ? '・暗号化あり' : '')); }
const run = fn => { chain = chain.then(fn).catch(e => sst(errMsg(e))); return chain; };

/* ---------- 暗号化（合言葉 → AES-GCM） ---------- */
const b64 = u => btoa(String.fromCharCode(...u)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(pass, saltB64) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(saltB64), iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function enc(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, ckey, new TextEncoder().encode(JSON.stringify(obj))));
  return b64(iv) + '.' + b64(ct);
}
async function dec(s) {
  const [iv, ct] = s.split('.');
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, ckey, unb64(ct))));
}
const pack = async (base, payload) => encMode ? Object.assign(base, { enc: await enc(payload) }) : Object.assign(base, payload);
const unpack = async raw => { try { return raw.enc ? await dec(raw.enc) : raw; } catch { return null; } };

/* ---------- 読み込み・ログイン ---------- */
async function start() {
  syncUI();
  if (!SY.cfg) return;
  sst('読み込み中…');
  try {
    const [a, au, fs] = await Promise.all([import(FBU + 'firebase-app.js'), import(FBU + 'firebase-auth.js'), import(FBU + 'firebase-firestore.js')]);
    const app = a.initializeApp(SY.cfg);
    fb = { au, fs, auth: au.getAuth(app), db: fs.getFirestore(app) };
  } catch { sst('同期の部品を読み込めませんでした（ネットワークを確認してください）'); return; }
  fb.au.onAuthStateChanged(fb.auth, u => {
    user = u;
    if (u) connect(); else { teardown(); sst('「Googleでログイン」を押してください'); }
    syncUI();
  }, e => sst(errMsg(e)));
  syncUI();
}
function teardown() { unsubs.forEach(f => { try { f(); } catch {} }); unsubs = []; ready = false; }

async function connect() {
  teardown(); sst('接続中…');
  const { doc, getDoc, setDoc } = fb.fs, uid = user.uid;
  try {
    const mref = doc(fb.db, 'users', uid, 'meta', 'crypto'), ms = await getDoc(mref);
    if (ms.exists() && ms.data().enc) {
      encMode = true;
      if (!SY.pass) { sst('このデータは暗号化されています。「同期をやめる」→ もう一度接続して、合言葉を入れてください。'); syncUI(); return; }
      ckey = await deriveKey(SY.pass, ms.data().salt);
      try { await dec(ms.data().check); } catch { ckey = null; sst('合言葉が違います。「同期をやめる」→ もう一度接続して入れ直してください。'); syncUI(); return; }
    } else if (ms.exists()) {
      encMode = false;
    } else if (SY.pass) {
      const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
      ckey = await deriveKey(SY.pass, salt); encMode = true;
      await setDoc(mref, { enc: true, salt, check: await enc({ ok: 1 }) });
    } else {
      encMode = false; await setDoc(mref, { enc: false });
    }
    ready = true; syncUI();
    if (readyCb) readyCb(api);
  } catch (e) { ready = false; syncUI(); sst(errMsg(e)); }
}

/* ---------- 設定欄 ---------- */
function parseCfg(t) {
  t = (t || '').trim();
  if (t.startsWith('dl1:')) { try { return JSON.parse(atob(t.slice(4))); } catch { return null; } }
  const raw = {}; for (const m of t.matchAll(/["']?(\w+)["']?\s*:\s*["']([^"']*)["']/g)) raw[m[1]] = m[2];
  if (!['apiKey', 'authDomain', 'projectId', 'appId'].every(k => raw[k])) return null;
  const cfg = {}; ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'].forEach(k => { if (raw[k]) cfg[k] = raw[k]; });
  return cfg;
}
function copyText(s, msg) { (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => flash(msg), () => { prompt('コピーしてください', s); }); }

const CSS = `
#sk-root{margin:24px 0;background:var(--panel,#fff);color:var(--fg,#222);border:1px solid var(--line,#ddd);border-radius:14px;padding:14px;font-size:14px;line-height:1.6}
#sk-root summary{cursor:pointer;font-weight:700}
#sk-root .sk-badge{background:var(--accbg,#e4f5ec);color:var(--acc2,#278658);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:400}
#sk-root .sk-body{margin-top:10px}
#sk-root ol{padding-left:20px}#sk-root li{margin-bottom:8px}
#sk-root code{background:var(--bg,#f4f4f4);border:1px solid var(--line,#ddd);border-radius:6px;padding:0 5px;font-size:13px;word-break:break-all}
#sk-root pre{background:var(--bg,#f4f4f4);border:1px solid var(--line,#ddd);border-radius:8px;padding:8px 10px;font-size:12px;overflow:auto;margin:6px 0}
#sk-root a{color:var(--acc2,#278658)}
#sk-root .sk-sub,#sk-root .sk-note{color:var(--sub,#777);font-size:12px}
#sk-root .sk-note{margin-top:8px}
#sk-root label{display:block;font-size:12px;color:var(--sub,#777);margin:8px 0 4px}
#sk-root textarea,#sk-root input{width:100%;font:inherit;color:var(--fg,#222);background:var(--bg,#f4f4f4);border:1px solid var(--line,#ddd);border-radius:10px;padding:9px 11px}
#sk-root textarea{font:13px/1.4 ui-monospace,monospace;resize:vertical}
#sk-root .sk-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#sk-root button{font:inherit;cursor:pointer;border-radius:10px;padding:8px 14px;border:1px solid var(--line,#ddd);background:var(--panel,#fff);color:var(--fg,#222)}
#sk-root button.sk-p{background:var(--acc,#2f9e6b);border-color:transparent;color:#fff;font-weight:700}
#sk-root button.sk-d{color:var(--bad,#d64545)}
#sk-root .sk-hide{display:none!important}`;
const PANEL = `<details id="sk-root"><summary>☁ 同期したい人は（PCとスマホで記録を共有・上級者向け） <span class="sk-badge" id="sk-badge"></span></summary>
<div class="sk-body">
<p>ふだんは同期しなくても使えます。<b>PCとスマホで同じ記録を見たい人だけ</b>、下の手順で<b>自分専用のデータ置き場（Googleの Firebase・無料枠）</b>を作ってつなぎます。記録はあなた自身のFirebaseに保存され、運営者には届きません。所要時間は10分ほどです。</p>
<p><b>日記・カロリー記録のどちらか1つで設定すれば、同じ端末ではもう一方も自動でつながります</b>（設定は共通です）。</p>
<ol>
<li><a href="https://console.firebase.google.com/" target="_blank" rel="noopener">Firebaseコンソール</a>を開き、Googleアカウントでログイン →「<b>Firebase プロジェクトを設定して開始</b>」（すでにプロジェクトがある人は「プロジェクトを追加」）を押し、名前（例：my-diary）を入れ、「Firebase の規約に同意します」にチェックして続行します（「Google デベロッパー プログラム」は不要なのでオフでOK）。次の「Firebase で Gemini を有効にする」と「Googleアナリティクス」は、どちらも<b>オフ</b>にして、プロジェクトを作成します。</li>
<li>左メニュー「セキュリティ」→「Authentication」→「始める」→「ログイン方法」タブの「Google」を押し、「<b>有効にする</b>」をオンにします。「プロジェクトのサポートメール」に自分のメールアドレスを選んで「保存」します。</li>
<li>Authentication の「設定」タブ →「承認済みドメイン」→「ドメインの追加」で、<code>${location.hostname}</code> を追加します。<span class="sk-sub">（これを忘れるとログインできません）</span></li>
<li>左メニュー「Database と Storage」→「Firestore」→「データベースの作成」を押します。エディションは「Standard」、データベースIDは <code>(default)</code> のまま「次へ」。ロケーションは <code>asia-northeast1（東京）</code>（<b>あとから変更できません</b>）、セキュリティルールは「<b>本番環境モード</b>」を選んで作成します。</li>
<li>Firestore の「ルール」タブの中身を<b>すべて消して</b>、下のルールを貼り付け →「公開」を押します。
<pre id="sk-rules">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}</pre><button type="button" id="sk-copyrules">ルールをコピー</button></li>
<li>左メニューの「設定」（歯車）→「プロジェクトの設定」→「全般」を下へスクロールし、「マイアプリ」の<b>ウェブ（&lt;/&gt;）</b>アイコンを押します。ニックネームを入れ（「Firebase Hosting も設定します」は<b>チェックしない</b>）、「アプリを登録」を押すと、<code>firebaseConfig = { … }</code> を含むコードが表示されます。右下のコピーボタンでコード全体をコピーします（そのまま貼ってOKです）。</li>
<li>下の欄に貼り付けて「保存して接続」→「Googleでログイン」を押します。これで同期が始まります。</li>
<li>もう1台（スマホ／PC）でも、このページを開いて同じ欄に貼ります。<b>「設定コードをコピー」</b>で作れるコードを貼ってもOKです（合言葉は別に入れます）。同じGoogleアカウントでログインすれば、記録がそろいます。LINEやXなどの中で開いたブラウザでは、Googleログインに失敗することがあります。ChromeやSafariで開いてください。</li>
</ol>
<label class="sk-cfgonly" for="sk-cfg">firebaseConfig（または設定コード）</label>
<textarea id="sk-cfg" class="sk-cfgonly" rows="5" spellcheck="false" placeholder="const firebaseConfig = {&#10;  apiKey: &quot;…&quot;,&#10;  authDomain: &quot;…&quot;,&#10;  projectId: &quot;…&quot;,&#10;  appId: &quot;…&quot;&#10;};"></textarea>
<label class="sk-cfgonly" for="sk-pass">暗号化の合言葉（任意）</label>
<input class="sk-cfgonly" type="password" id="sk-pass" autocomplete="off" placeholder="入れると、本文を暗号化してから保存します">
<div class="sk-note sk-cfgonly">合言葉を決めると、Firebaseに置かれる本文などはこの端末で暗号化され、あなたにも合言葉なしでは読めません。<b>忘れると復元できません。</b>どの端末にも同じ合言葉を入れてください。<b>最初の接続のときだけ</b>決められます（あとから変更はできません）。</div>
<div class="sk-row">
<button type="button" class="sk-p" id="sk-connect">保存して接続</button>
<button type="button" class="sk-p sk-hide" id="sk-login">Googleでログイン</button>
<button type="button" class="sk-hide" id="sk-code">設定コードをコピー</button>
<button type="button" class="sk-d sk-hide" id="sk-off">同期をやめる</button>
</div>
<div class="sk-note" id="sk-stat" role="status">未設定</div>
<div class="sk-note" id="sk-flash"></div>
<div class="sk-note">「同期をやめる」は、この端末の同期設定を消すだけです。記録は、この端末にも Firebase にも残ります。</div>
</div></details>`;

function mount(el) {
  if (!el) return;
  if (!$('sk-css')) { const s = document.createElement('style'); s.id = 'sk-css'; s.textContent = CSS; document.head.appendChild(s); }
  el.innerHTML = PANEL;
  $('sk-copyrules').onclick = () => copyText($('sk-rules').textContent, 'ルールをコピーしました');
  $('sk-connect').onclick = () => {
    const cfg = parseCfg($('sk-cfg').value);
    if (!cfg) { flash('設定を読み取れませんでした。firebaseConfig の { } の中身をそのまま貼ってください'); return; }
    SY = { cfg, pass: $('sk-pass').value }; saveSY(); $('sk-cfg').value = ''; $('sk-pass').value = '';
    start();
  };
  $('sk-login').onclick = () => fb.au.signInWithPopup(fb.auth, new fb.au.GoogleAuthProvider()).catch(e => { sst(errMsg(e)); flash(errMsg(e)); });
  $('sk-code').onclick = () => copyText('dl1:' + btoa(JSON.stringify(SY.cfg)), '設定コードをコピーしました（他の端末の欄に貼ってください。合言葉は別に入れます）');
  $('sk-off').onclick = () => {
    if (!confirm('この端末の同期をやめますか？（日記・カロリー記録の両方で同期が止まります。記録は、この端末にも Firebase にも残ります）')) return;
    try { localStorage.removeItem(KEY); localStorage.removeItem(OLDKEY); } catch {}
    location.reload();
  };
  start();
}

/* ---------- アプリ側から使う窓口 ---------- */
const api = {
  init(opt) { readyCb = opt.onReady || null; mount(opt.mount); },
  isReady: () => ready,
  run, done, unpack,
  fail: e => sst(errMsg(e)),
  async put(col, id, base, payload) {
    const { doc, setDoc } = fb.fs;
    await setDoc(doc(fb.db, 'users', user.uid, col, id), await pack(base, payload));
  },
  watchCol(col, cb) {
    const { collection, onSnapshot } = fb.fs;
    unsubs.push(onSnapshot(collection(fb.db, 'users', user.uid, col), s => run(() => cb(s.docs.map(d => ({ id: d.id, raw: d.data() })))), e => sst(errMsg(e))));
  },
  watchDoc(col, id, cb) {
    const { doc, onSnapshot } = fb.fs;
    unsubs.push(onSnapshot(doc(fb.db, 'users', user.uid, col, id), s => run(() => cb(s.exists() ? s.data() : null)), e => sst(errMsg(e))));
  }
};
window.SyncKit = api;
})();
