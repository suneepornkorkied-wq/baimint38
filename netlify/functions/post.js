// netlify/functions/post.js
// ดึงข้อมูลโพสต์จาก Firebase แล้วสร้าง HTML พร้อม Open Graph tags

const https = require('https');

const FIREBASE_PROJECT = 'baimint888-a8088';
const FIREBASE_API_KEY = 'AIzaSyDN7Hnf-0EEAxnabvlGPgVEL6limOjn6dI';
const COLLECTION = 'parts_app';
const DOC_ID = 'data';
const SITE_URL = 'https://baimint38.netlify.app';

// ดึงข้อมูลจาก Firestore REST API
function fetchFirestore() {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/${COLLECTION}/${DOC_ID}?key=${FIREBASE_API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// แปลง Firestore format → object ปกติ
function parseFirestoreValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (val.mapValue) {
    const obj = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      obj[k] = parseFirestoreValue(fields[k]);
    }
    return obj;
  }
  return null;
}

function parseFirestoreDoc(doc) {
  const fields = doc.fields || {};
  const obj = {};
  for (const k of Object.keys(fields)) {
    obj[k] = parseFirestoreValue(fields[k]);
  }
  return obj;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function priceText(post) {
  if (!post.price) return '';
  return post.price2
    ? `${Number(post.price).toLocaleString()} - ${Number(post.price2).toLocaleString()}฿`
    : `${Number(post.price).toLocaleString()}฿`;
}

function buildHTML({ shopName, title, description, image, price, postUrl, lineId }) {
  const lineUrl = lineId ? `https://line.me/ti/p/~${lineId}` : '#';
  const priceHtml = price ? `<div class="price">${esc(price)}</div>` : '';
  const imgHtml = image
    ? `<div class="img-wrap"><img src="${esc(image)}" alt="${esc(title)}"></div>`
    : `<div class="img-wrap"><div class="placeholder">📱</div></div>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>

<!-- Open Graph สำหรับ Facebook -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(shopName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(postUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;600;700&family=Noto+Sans+Thai:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Noto Sans Thai','Bai Jamjuree',sans-serif;background:#f0f2f5;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.12);max-width:540px;width:100%;overflow:hidden}
  .img-wrap{width:100%;aspect-ratio:16/9;background:#e4e6eb;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .img-wrap img{width:100%;height:100%;object-fit:cover}
  .placeholder{font-size:4rem;background:linear-gradient(135deg,#0f8a7e,#0b6b61);width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .body{padding:20px}
  .shop{font-size:.78rem;color:#65676b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-family:'Bai Jamjuree'}
  .title{font-family:'Bai Jamjuree';font-weight:700;font-size:1.15rem;color:#1c1e21;line-height:1.4;margin-bottom:8px}
  .desc{font-size:.9rem;color:#3e4042;line-height:1.6;white-space:pre-wrap;margin-bottom:12px}
  .price{display:inline-block;background:#e7f3ff;color:#1877f2;font-family:'Bai Jamjuree';font-weight:700;font-size:1rem;padding:5px 14px;border-radius:8px;margin-bottom:16px}
  .actions{display:flex;gap:10px;flex-wrap:wrap}
  .btn{flex:1;min-width:120px;text-align:center;text-decoration:none;font-family:'Bai Jamjuree';font-weight:600;font-size:.9rem;padding:12px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px}
  .btn.line{background:#06c755;color:#fff}
  .btn.back{background:#e4e6eb;color:#1c1e21}
</style>
</head>
<body>
<div class="card">
  ${imgHtml}
  <div class="body">
    <div class="shop">${esc(shopName)}</div>
    <div class="title">${esc(title)}</div>
    <div class="desc">${esc(description)}</div>
    ${priceHtml}
    <div class="actions">
      <a class="btn line" href="${esc(lineUrl)}" target="_blank">💬 ทักสอบถาม</a>
      <a class="btn back" href="${SITE_URL}">← ดูสินค้าทั้งหมด</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

exports.handler = async (event) => {
  const postId = Number(event.queryStringParameters?.id || 0);

  if (!postId) {
    return { statusCode: 302, headers: { Location: SITE_URL } };
  }

  try {
    const firestoreDoc = await fetchFirestore();
    const data = parseFirestoreDoc(firestoreDoc);

    const shop = data.shop || {};
    const posts = Array.isArray(data.posts) ? data.posts : [];
    const post = posts.find(p => Number(p.id) === postId);

    if (!post) {
      return { statusCode: 302, headers: { Location: SITE_URL } };
    }

    const shopName = shop.name || 'ใบมิ้นท์ งานช่าง';
    const caption = (post.caption || '').trim();
    const lines = caption.split('\n');
    const title = (lines[0] || shopName) + (priceText(post) ? ' — ' + priceText(post) : '');
    const description = lines.slice(1).join('\n').trim() || caption || 'อะไหล่มือถือทุกรุ่น ราคาถูก งานคุณภาพ';
    const image = (post.images && post.images[0]) || '';
    const postUrl = `${SITE_URL}/post?id=${postId}`;

    const html = buildHTML({
      shopName,
      title,
      description,
      image,
      price: priceText(post),
      postUrl,
      lineId: shop.line || '',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 302, headers: { Location: SITE_URL } };
  }
};
