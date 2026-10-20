/* MovieMaker 共通部品：投稿用の「タイトル」と「説明欄」を自動で作る（日本語＋英語）。
   各ページは </body> の前で <script src="../shared/meta.js"></script> を読み込むだけ。
   ページの場所（/moviemaker/<フォルダ名>/）から、どのツールかを自動で判断する。 */
(function () {
  'use strict';
  const COMMON = {
    jp: { warn: '※見え方には個人差があります。見ていて気分が悪くなったら、すぐにやめてください。', cta: '面白かったら、高評価・チャンネル登録をお願いします！', head: { how: '▼ 見方', why: '▼ 錯視の解説', note: '▼ 注意' } },
    en: { warn: '*How it looks varies from person to person. Stop watching if you feel unwell.', cta: 'If you enjoyed this, please like and subscribe!', head: { how: '▼ How to watch', why: '▼ About this illusion', note: '▼ Note' } }
  };
  // t = {theme} に入る一言（あれば）
  const TOOLS = {
    'illusion-maker': {
      motion: true, tags: ['錯視', '残像', '不思議', 'Shorts'], enTags: ['OpticalIllusion', 'Afterimage', 'Shorts'],
      jpTitles: ['【錯視】白黒なのに、色がついて見える？{t}', '【残像錯視】じっと見つめたら、色が見える…？{t}', '色がないのに色が見える【カラーネガ錯視】{t}', '【錯視】この画像、何色に見えますか？{t}'],
      jpHook: 'この画像、白黒（または色がおかしな画像）のはずなのに…？ 錯視に挑戦してみてください。',
      jpHow: ['画面の中央の点を、目を動かさずに、じっと見つめてください。', 'そのあと画像が切り替わると、色がついて見えることがあります。'],
      jpWhy: ['同じ色を見続けると、目の中の色を感じる細胞が疲れて、反対の色の「残像」が見えると言われています（補色残像）。'],
      enTitles: ['Optical Illusion: Do You See Colors in This Black & White Image? {t}', 'Stare at the Dot... Can You See the Colors? {t}', 'Afterimage Illusion: Colors That Aren\'t There {t}'],
      enHook: 'This image should be black and white... or is it? Try this illusion.',
      enHow: ['Keep your eyes on the dot in the center without moving.', 'When the image changes, you may see colors.'],
      enWhy: ['Staring at a color tires the color-sensing cells in your eyes, which can cause an afterimage in the opposite color (complementary afterimage).']
    },
    'body-illusion': {
      motion: false, tags: ['錯視', '体型', '不思議', 'Shorts'], enTags: ['OpticalIllusion', 'Illusion', 'Shorts'],
      jpTitles: ['【錯視】太って見えるのはどっち？ 実はどちらも同じ人！{t}', 'この2人のA、同じ体型に見えますか？【錯視】{t}', '【錯視】周りの人で、体型が違って見える？{t}'],
      jpHook: '同じ人物なのに、周りの人によって体型が違って見える錯視です。',
      jpHow: ['左右のどちらの人物Aが太って見えるか、考えてみてください。', '最後に周りの人が消えると…？'],
      jpWhy: ['まわりにある大きいものや小さいものとの比較で、真ん中の人の大きさが違って感じられる「対比効果」と言われています。'],
      enTitles: ['Optical Illusion: Which "A" Looks Bigger? They\'re the Same Person! {t}', 'Do These Two A\'s Look the Same Size? {t}'],
      enHook: 'It\'s the same person, but the people around make the body shape look different.',
      enHow: ['Decide which "A" looks wider.', 'Then watch what happens when the people around disappear.'],
      enWhy: ['The size of the center person is judged relative to the surroundings (a contrast effect).']
    },
    'scanimation-maker': {
      motion: true, tags: ['錯視', 'スキャニメーション', 'モアレ', 'Shorts'], enTags: ['OpticalIllusion', 'Scanimation', 'Moire', 'Shorts'],
      jpTitles: ['【錯視】静止画が動き出す？ スキャニメーション{t}', '縞をスライドさせると、絵が動いて見える【モアレ錯視】{t}', '【錯視】ただの縞模様が…動き出す！{t}'],
      jpHook: '静止画なのに、縞（しま）をスライドさせると絵が動き出します。',
      jpHow: ['縞模様の絵を、少し離れて見てください。', '黒い縞が動くと、絵が動いて見えます。'],
      jpWhy: ['縞のすき間から見える絵が、縞が動くことで次々に切り替わり、アニメーションのように見える仕組みです（スキャニメーション）。'],
      enTitles: ['Optical Illusion: A Still Image Starts Moving? Scanimation {t}', 'Slide the Stripes and the Picture Moves! (Moire Illusion) {t}'],
      enHook: 'It\'s a still image, but when the stripes slide, the picture seems to move.',
      enHow: ['Look at the striped picture from a little distance.', 'When the black stripes move, the picture appears to animate.'],
      enWhy: ['Different frames show through the gaps between stripes as the stripes slide, creating the look of animation (scanimation).']
    },
    'motion-aftereffect': {
      motion: true, tags: ['錯視', '滝の錯視', '運動残効', 'Shorts'], enTags: ['OpticalIllusion', 'WaterfallIllusion', 'MotionAftereffect', 'Shorts'],
      jpTitles: ['【錯視】10秒見つめたあと、写真が動いて見える【滝の錯視】{t}', '見つめたあとに、静止画が動き出す？【運動残効】{t}', '【錯視】止まっているのに、動いて見える…{t}'],
      jpHook: '拡大・縮小する映像をしばらく見つめたあと、静止した写真が逆向きに動いて見える錯視です。',
      jpHow: ['画面の中央を、目を動かさずにじっと見つめてください。', 'そのあと静止すると、写真が動いて見えることがあります。'],
      jpWhy: ['同じ向きの動きを見続けると、その向きの動きを感じる細胞が疲れて、止まったものが逆向きに動いて見える「運動残効（滝の錯視）」と言われています。'],
      enTitles: ['Optical Illusion: Stare for 10 Seconds, Then the Photo Seems to Move (Waterfall Illusion) {t}', 'A Still Picture Starts Moving After You Stare? {t}'],
      enHook: 'After staring at a zooming picture, the still photo seems to move in the opposite direction.',
      enHow: ['Keep your eyes fixed on the center without moving.', 'When the image stops, you may see it moving.'],
      enWhy: ['After watching motion in one direction, the cells sensing that motion tire out, and still objects appear to move the other way (motion aftereffect / waterfall illusion).']
    },
    'illusion-bait': {
      motion: true, tags: ['錯視', '動く錯視', '錯視テスト', 'Shorts'], enTags: ['OpticalIllusion', 'IllusionTest', 'Shorts'],
      jpTitles: ['【錯視】これ、動いて見えますか？{t}', '動いて見える人は、どれくらい？【錯視テスト】{t}', '【錯視】静止画なのに回って見える…？{t}', 'この絵、ぐるぐる動いて見えたら…？{t}'],
      jpHook: '静止画なのに、動いて見える人がいる錯視です。あなたにはどう見えますか？',
      jpHow: ['画面全体をぼんやり眺めてみてください。', '動いて見えるかどうかを、コメントで教えてください。'],
      jpWhy: ['明るさや色の並び方によって、静止画が動いて見える「錯視的運動」と言われています。見え方には個人差があります。'],
      jpNote: ['※この動画は娯楽のための錯視です。見え方で、疲れや健康状態がわかるという医学的な根拠はありません。'],
      enTitles: ['Optical Illusion: Does This Image Move for You? {t}', 'Illusion Test: Do You See It Moving? {t}', 'A Still Image That Seems to Spin? {t}'],
      enHook: 'It\'s a still image, but some people see it move. What do you see?',
      enHow: ['Look at the whole picture loosely.', 'Tell us in the comments whether it seems to move.'],
      enWhy: ['Certain arrangements of brightness and color make a still image appear to move ("illusory motion"). It varies from person to person.'],
      enNote: ['*This video is for entertainment. There is no medical basis for judging fatigue or health from how you see it.']
    },
    'munker-illusion': {
      motion: false, tags: ['錯視', 'ムンカー錯視', '色', 'Shorts'], enTags: ['OpticalIllusion', 'MunkerIllusion', 'Color', 'Shorts'],
      jpTitles: ['【錯視】2つの形、同じ色？ 違う色？ ムンカー錯視{t}', '同じ色なのに違う色に見える…【ムンカー錯視】{t}', '【錯視】縞を消すと、答えがわかる{t}', '【錯視】この色、同じだと信じられますか？{t}'],
      jpHook: '2つの形は、同じ色でしょうか？ 違う色でしょうか？（少し離れて見てみてください）',
      jpHow: ['2つの形の色を、よく見比べてください。', '縞が消えたり、近づいたりして、答え合わせをします。'],
      jpWhy: ['形のまわりの縞の色に引きずられて、同じ色の形が違う色に見えてしまう「ムンカー錯視（色の同化）」と言われています。'],
      enTitles: ['Optical Illusion: Are the Two Shapes the Same Color? (Munker Illusion) {t}', 'Same Color, Different Look? Munker Illusion {t}', 'Remove the Stripes and See the Truth {t}'],
      enHook: 'Are the two shapes the same color, or different? (Try looking from a little distance.)',
      enHow: ['Compare the colors of the two shapes carefully.', 'We\'ll remove the stripes and zoom in to reveal the answer.'],
      enWhy: ['The shapes\' color is pulled toward the color of the stripes around them, so identical colors can look different (Munker illusion / color assimilation).']
    },
    'cross-illusion': {
      motion: true, tags: ['錯視', '幾何学的錯視', '立体', 'Shorts'], enTags: ['OpticalIllusion', 'GeometricIllusion', 'Shorts'],
      jpTitles: ['【錯視】ただの正方形のマス目が、膨らんで見える？{t}', '十字を置くと立体に見える…？【幾何学的錯視】{t}', '【錯視】全部、正方形なのに…ゆがんで見える？{t}', '【錯視】ゆがみが動いて見えたら、今日いいことあるかも？{t}'],
      jpHook: '市松模様の交点に、小さな十字を置くと、マス目が膨らんだりへこんだりして見える錯視です。',
      jpHow: ['マス目のゆがみに、注目してみてください。', '十字を取ると、ただの正方形のマス目だけだとわかります。'],
      jpWhy: ['交点に置いた小さな十字の色によって、マス目の角が丸く見え、立体的に膨らんで見えると言われています。'],
      enTitles: ['Optical Illusion: Plain Squares Look Like They\'re Bulging? {t}', 'Add Small Crosses and the Grid Looks 3D... {t}', 'All Squares, Yet They Look Warped! {t}'],
      enHook: 'Small crosses placed at the grid\'s intersections make the squares look like they bulge or dent.',
      enHow: ['Watch how the grid seems to warp.', 'Remove the crosses and you\'ll see nothing but plain squares.'],
      enWhy: ['The colors of the small crosses make the corners of the squares look rounded, so the grid appears to swell in 3D.']
    },
    'dance-silhouette': {
      motion: false, rights: true, tags: ['ダンス', 'シルエット', 'AI', 'Shorts'], enTags: ['Dance', 'Silhouette', 'Shorts'],
      jpTitles: ['【ダンス】動く人だけがシルエットになる{t}', 'ダンス動画をネオンシルエットにしてみた{t}', '【加工】踊る人だけを光らせたら…？{t}'],
      jpHook: 'ダンス動画から、動いている人だけを切り抜いて、シルエットにしてみました。',
      jpHow: ['色・輪郭・光・残像・ビートに合わせた脈動などを調整して作っています。', '人物の切り抜きは、ブラウザの中で動く画像認識（MediaPipe）で行っています。'],
      jpWhy: [],
      jpNote: ['※元の動画や BGM の権利にご注意ください。権利を確認した素材だけを使って投稿してください。'],
      enTitles: ['Dance Video Turned into a Neon Silhouette {t}', 'Only the Dancer Glows: Silhouette Effect {t}'],
      enHook: 'I cut out only the moving dancer from a dance video and turned it into a silhouette.',
      enHow: ['Color, outline, glow, afterimage trails and beat-synced pulses are adjustable.', 'The person cut-out runs in the browser using MediaPipe.'],
      enWhy: [],
      enNote: ['*Please make sure you have the rights to the source video and music before posting.']
    },
    'stereo-3d': {
      motion: true, tags: ['立体視', '裸眼3D', '平行法', 'Shorts'], enTags: ['Stereogram', 'Stereoscopic', 'Parallel', 'Shorts'],
      jpTitles: ['【裸眼3D】眼鏡なしで、光の粒が浮かんで見える（平行法）{t}', '【立体視】2つの画面を重ねると、3Dで動き出す{t}', '【裸眼立体視】平行法で見る、光のうずまき{t}', '見えたら才能？ 裸眼3Dの光の粒{t}'],
      jpHook: '左右2つの画面を、眼鏡なしで重ねて見ると、光の粒が奥行きをもって浮かんで見える立体視の動画です。',
      jpHow: ['画面から少し離れて、目の力をぬき、画面のずっと向こうを見るようにします（平行法）。', '上の丸が、左右で重なって3つに見えたら、真ん中の丸に注目してください。', '見えにくいときは、画面を小さくする、または少し離れてみてください。'],
      jpWhy: ['左右の目に少しだけ違う絵を見せると、脳が奥行きを感じ取ります（両眼視差）。2つの画面を重ねて見ることで、眼鏡なしでも立体的に見えます。'],
      jpNote: ['※立体の見え方には個人差があり、見えない人もいます。これは病気や能力とは関係ありません。'],
      enTitles: ['Naked-Eye 3D: Glowing Particles Float Without Glasses (Parallel View) {t}', 'Stereoscopic Video: Fuse the Two Images in 3D {t}', 'Can You See It in 3D? Parallel Viewing {t}'],
      enHook: 'A side-by-side stereoscopic video. Fuse the two images without glasses and the particles appear to float in depth.',
      enHow: ['Sit a little back, relax your eyes, and look "through" the screen (parallel viewing).', 'When the circles on top merge into three, focus on the middle one.', 'If it is hard, make the video smaller or move farther away.'],
      enWhy: ['Showing each eye a slightly different image lets the brain perceive depth (binocular disparity).'],
      enNote: ['*Some people cannot see stereo images. This is not related to any illness or ability.']
    },
    'silhouette-illusion': {
      motion: true, tags: ['錯視', 'シルエット', '回転', 'Shorts'], enTags: ['OpticalIllusion', 'SpinningDancer', 'Shorts'],
      jpTitles: ['【錯視】このシルエット、右回り？ 左回り？{t}', '見るたびに回る向きが変わる…？【回転シルエット錯視】{t}', '【錯視】同じ動画なのに、逆回転に見える{t}'],
      jpHook: '影だけの回転する人影は、右回りに見えますか？ 左回りに見えますか？',
      jpHow: ['しばらく見つめていると、回る向きが入れ替わって見えることがあります。', 'どちら向きに見えたか、コメントで教えてください。'],
      jpWhy: ['影だけの絵には、手前と奥を決める手がかりが少ないため、手前と奥が入れ替わって見え、回転の向きが反転して見えることがあります（スピニング・ダンサー錯視として知られています）。'],
      enTitles: ['Optical Illusion: Is the Silhouette Spinning Clockwise or Counterclockwise? {t}', 'The Spinning Direction Keeps Changing? {t}'],
      enHook: 'Does the spinning silhouette turn clockwise or counterclockwise?',
      enHow: ['Keep watching and the direction may flip.', 'Let us know in the comments which way you saw it.'],
      enWhy: ['A silhouette has few depth cues, so front and back can swap in your perception and the rotation can seem to reverse (known as the spinning dancer illusion).']
    }
  };
  const GENERIC = { jpTitles: ['【自動生成】動画のタイトル{t}'], jpHook: 'この動画は、ブラウザで作りました。', jpHow: [], jpWhy: [], tags: ['Shorts'], enTitles: ['Video title {t}'], enHook: 'Made in the browser.', enHow: [], enWhy: [], enTags: ['Shorts'] };

  function keyFromPath() {
    const seg = location.pathname.split('/').filter(Boolean).filter(s => !/\.html?$/i.test(s)); return seg[seg.length - 1] || '';
  }
  function build(tool, lang, o) {
    const T = TOOLS[tool] || GENERIC, jp = lang === 'jp', C = COMMON[lang], theme = (o.theme || '').trim();
    const titles = jp ? T.jpTitles : T.enTitles, tpl = titles[o.idx % titles.length];
    let title = tpl.replace('{t}', theme ? (jp ? '｜' : ' | ') + theme : '').replace(/\s+$/, '');
    if ([...title].length > 100) title = [...title].slice(0, 100).join('');
    const hook = jp ? T.jpHook : T.enHook, how = jp ? T.jpHow : T.enHow, why = jp ? T.jpWhy : T.enWhy, notes = (jp ? T.jpNote : T.enNote) || [];
    const lines = [hook + (theme ? (jp ? `（${theme}）` : ` (${theme})`) : ''), ''];
    if (how.length) lines.push(C.head.how, ...how.map(x => '・' + x), '');
    if (why.length) lines.push(C.head.why, ...why.map(x => '・' + x), '');
    const nl = [...(T.motion ? [C.warn] : []), ...notes];
    if (nl.length) lines.push(C.head.note, ...nl, '');
    const cta = (o.cta || '').trim(); if (cta) lines.push(cta, '');
    const tags = (jp ? T.tags : (T.enTags || T.tags)).filter(t => o.shorts || t !== 'Shorts');
    lines.push(tags.map(t => '#' + t).join(' '));
    return { title, desc: lines.join('\n') };
  }
  const CSS = `.mm-meta{background:#1c1f29;border:1px solid #2c3040;border-radius:12px;padding:16px;margin:16px 0;color:#e8eaf0;font-family:system-ui,-apple-system,"Segoe UI","Hiragino Sans","Yu Gothic",sans-serif;line-height:1.5;text-align:left}
.mm-meta h2{font-size:1rem;margin:0 0 6px;color:#e8eaf0}.mm-meta .sub{color:#9aa0b4;font-size:.82rem;margin:0 0 10px}
.mm-meta label{display:block;font-size:.8rem;color:#9aa0b4;margin:10px 0 4px}
.mm-meta input[type=text],.mm-meta textarea{width:100%;background:#12141a;border:1px solid #2c3040;color:#e8eaf0;border-radius:8px;padding:8px 10px;font-size:.92rem;font-family:inherit;box-sizing:border-box}
.mm-meta textarea{min-height:190px;resize:vertical}
.mm-meta .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
.mm-meta button{background:#4a5cf0;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-size:.88rem;cursor:pointer;font-family:inherit}.mm-meta button.sec{background:#2c3040;color:#e8eaf0}
.mm-meta .chk{display:flex;align-items:center;gap:6px;font-size:.85rem;color:#e8eaf0;margin:0}.mm-meta .cnt{color:#9aa0b4;font-size:.78rem}.mm-meta .cnt.err{color:#ff6b6b}
.mm-fab{position:fixed;right:14px;bottom:14px;z-index:9998;background:#4a5cf0;color:#fff;border:0;border-radius:24px;padding:10px 16px;font-size:.9rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4);font-family:system-ui,"Yu Gothic",sans-serif}
.mm-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px}
.mm-ov .mm-meta{max-width:640px;width:100%;max-height:92vh;overflow:auto;margin:0}`;
  function panel(tool) {
    const el = document.createElement('section'); el.className = 'mm-meta';
    el.innerHTML = `<h2>投稿用のタイトルと説明欄（自動で作ります）</h2><p class="sub">動画を保存したら、YouTube に貼り付けて使ってください。内容は自由に書き換えられます。</p>
      <div class="row"><div style="flex:1;min-width:200px"><label style="margin-top:0">一言・テーマ（任意。タイトルと説明に入ります）</label><input type="text" data-k="theme" placeholder="例：猫の写真、ダンス練習の動画"></div></div>
      <div class="row"><label class="chk"><input type="checkbox" data-k="shorts" checked> Shorts 向け（#Shorts をつける）</label><label class="chk"><input type="checkbox" data-k="en" checked> 英語版も出す</label></div>
      <label>説明欄の最後の呼びかけ</label><input type="text" data-k="cta" value="${COMMON.jp.cta}">
      <div class="row"><button type="button" data-k="regen">別のタイトル案にする</button></div>
      <label>タイトル（日本語）</label><input type="text" data-k="jt"><div class="cnt" data-k="jtc"></div>
      <label>説明欄（日本語）</label><textarea data-k="jd"></textarea>
      <div class="row"><button type="button" class="sec" data-k="cjt">タイトルをコピー</button><button type="button" class="sec" data-k="cjd">説明欄をコピー</button></div>
      <div data-k="enbox"><label>Title (English)</label><input type="text" data-k="et"><div class="cnt" data-k="etc"></div>
      <label>Description (English)</label><textarea data-k="ed"></textarea>
      <div class="row"><button type="button" class="sec" data-k="cet">Copy title</button><button type="button" class="sec" data-k="ced">Copy description</button></div></div>
      <div class="cnt" style="margin-top:8px">タイトルは100文字以内。説明欄の最初の3つのハッシュタグは、タイトルの上に表示されます。</div>`;
    const g = k => el.querySelector(`[data-k="${k}"]`);
    let idx = 0, dirty = { jt: false, jd: false, et: false, ed: false };
    const cnt = () => { for (const [a, b] of [['jt', 'jtc'], ['et', 'etc']]) { const n = [...g(a).value].length; g(b).textContent = n + ' 文字'; g(b).className = 'cnt' + (n > 100 ? ' err' : ''); } };
    function gen(force) {
      const o = { idx, theme: g('theme').value, cta: g('cta').value, shorts: g('shorts').checked };
      const jp = build(tool, 'jp', o), en = build(tool, 'en', Object.assign({}, o, { cta: COMMON.en.cta }));
      if (force || !dirty.jt) g('jt').value = jp.title; if (force || !dirty.jd) g('jd').value = jp.desc;
      if (force || !dirty.et) g('et').value = en.title; if (force || !dirty.ed) g('ed').value = en.desc;
      g('enbox').style.display = g('en').checked ? '' : 'none'; cnt();
    }
    ['jt', 'jd', 'et', 'ed'].forEach(k => g(k).addEventListener('input', () => { dirty[k] = true; cnt(); }));
    ['theme', 'cta', 'shorts', 'en'].forEach(k => g(k).addEventListener('input', () => gen(false)));
    g('regen').onclick = () => { idx++; dirty = { jt: false, jd: false, et: false, ed: false }; gen(true); };
    const copy = async (k, b) => { const v = g(k).value; try { await navigator.clipboard.writeText(v); } catch (e) { g(k).select(); document.execCommand('copy'); } const o = b.textContent; b.textContent = 'コピーしました'; setTimeout(() => b.textContent = o, 1400); };
    [['cjt', 'jt'], ['cjd', 'jd'], ['cet', 'et'], ['ced', 'ed']].forEach(([b, k]) => { g(b).onclick = e => copy(k, e.target); });
    gen(true); return el;
  }
  function mount(tool) {
    if (document.querySelector('.mm-meta, .mm-fab')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const main = document.querySelector('main');
    if (main) { main.appendChild(panel(tool)); return; }
    const fab = document.createElement('button'); fab.className = 'mm-fab'; fab.type = 'button'; fab.textContent = '📝 投稿用のタイトル・説明';
    fab.onclick = () => { const ov = document.createElement('div'); ov.className = 'mm-ov'; ov.appendChild(panel(tool)); ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); }); const close = document.createElement('button'); close.className = 'sec'; close.textContent = '閉じる'; close.style.marginTop = '12px'; close.onclick = () => ov.remove(); ov.firstChild.appendChild(close); document.body.appendChild(ov); };
    document.body.appendChild(fab);
  }
  const cs = document.currentScript, tool = (cs && cs.dataset.key) || keyFromPath();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(tool)); else mount(tool);
  window.MMMeta = { mount, build, TOOLS };
})();
