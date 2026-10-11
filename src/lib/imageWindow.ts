'use client';

/** 差枚・機械割の実績画像を子ウインドウ（別ウインドウ）に表示する */
export function openPayoutImageWindow(url: string, title: string) {
  const w = window.open('', 'sc_payout_pic', 'width=560,height=720,resizable=yes,scrollbars=yes');
  if (!w) {
    window.alert('ポップアップがブロックされました。ブラウザの設定でこのサイトのポップアップを許可してください。');
    return;
  }

  w.document.title = title;
  const style = w.document.createElement('style');
  style.textContent = `
    body { margin: 0; background: #14161a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .sc-pic-bar { padding: 8px 14px; background: #1d1f24; color: #e8e9ec; font-size: 13px; }
    .sc-pic-body { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 33px); }
    img { max-width: 100%; max-height: calc(100vh - 33px); display: block; }
  `;
  w.document.head.appendChild(style);

  const bar = w.document.createElement('div');
  bar.className = 'sc-pic-bar';
  bar.textContent = title;

  const body = w.document.createElement('div');
  body.className = 'sc-pic-body';
  const img = w.document.createElement('img');
  img.src = url;
  img.alt = title;
  body.appendChild(img);

  w.document.body.appendChild(bar);
  w.document.body.appendChild(body);
  w.focus();
}
