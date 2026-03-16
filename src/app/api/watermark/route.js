import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const text = formData.get('text') || 'Watermark';
    const position = formData.get('position') || 'bottom-right';
    const opacity = Math.max(0.1, Math.min(1, parseFloat(formData.get('opacity') || '0.5')));
    const fontSize = Math.max(12, Math.min(200, parseInt(formData.get('fontSize') || '40')));
    const color = formData.get('color') || '#ffffff';
    const repeat = formData.get('repeat') === 'true';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const { width: imgW = 800, height: imgH = 600 } = meta;

    // Parse hex color to RGB
    const hexToRgb = (hex) => {
      const h = hex.replace('#', '');
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
      };
    };
    const rgb = hexToRgb(color.length === 7 ? color : '#ffffff');
    const alpha = Math.round(opacity * 255);

    // Estimate text dimensions (rough: ~0.6 * fontSize per char)
    const textW = Math.round(text.length * fontSize * 0.6);
    const textH = Math.round(fontSize * 1.4);

    const makeTextSvg = (x, y) => `
      <svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.5)" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text
          x="${x}" y="${y}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})"
          filter="url(#shadow)"
          text-anchor="${x === imgW / 2 ? 'middle' : x <= textW ? 'start' : 'end'}"
          dominant-baseline="middle"
        >${text.replace(/[<>&"']/g, c => ({
          '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
        })[c])}</text>
      </svg>`;

    const padding = Math.max(fontSize * 0.5, 20);

    let composites = [];

    if (repeat) {
      // Tiled watermarks across the image
      const stepX = textW + fontSize * 2;
      const stepY = textH + fontSize * 2;
      for (let y = textH + padding; y < imgH; y += stepY) {
        for (let x = padding; x < imgW - textW; x += stepX) {
          const svgBuf = Buffer.from(makeTextSvg(x + textW / 2, y));
          composites.push({ input: svgBuf, blend: 'over' });
        }
      }
    } else {
      // Single position
      let x, y;
      const px = padding + textW / 2, py = padding + textH / 2;
      switch (position) {
        case 'top-left':     x = px;            y = py;            break;
        case 'top-center':   x = imgW / 2;      y = py;            break;
        case 'top-right':    x = imgW - px;     y = py;            break;
        case 'middle-left':  x = px;            y = imgH / 2;      break;
        case 'center':       x = imgW / 2;      y = imgH / 2;      break;
        case 'middle-right': x = imgW - px;     y = imgH / 2;      break;
        case 'bottom-left':  x = px;            y = imgH - py;     break;
        case 'bottom-center':x = imgW / 2;      y = imgH - py;     break;
        case 'bottom-right': x = imgW - px;     y = imgH - py;     break;
        default:             x = imgW - px;     y = imgH - py;
      }
      const svgBuf = Buffer.from(makeTextSvg(x, y));
      composites.push({ input: svgBuf, blend: 'over' });
    }

    let pipeline = sharp(buffer);
    if (composites.length > 0) {
      pipeline = pipeline.composite(composites);
    }

    const ext = (file.name || 'image.jpg').split('.').pop().toLowerCase();
    const outputFormat = ext === 'jpg' ? 'jpeg' : ['png', 'webp'].includes(ext) ? ext : 'jpeg';
    if (outputFormat === 'jpeg') pipeline = pipeline.jpeg({ quality: 92 });
    else if (outputFormat === 'png') pipeline = pipeline.png();
    else pipeline = pipeline.webp({ quality: 92 });

    const outputBuffer = await pipeline.toBuffer();
    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
    const outExt = outputFormat === 'jpeg' ? 'jpg' : outputFormat;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Content-Disposition': `attachment; filename="${baseName}-watermarked.${outExt}"`,
      },
    });
  } catch (err) {
    console.error('Watermark error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors du traitement' }, { status: 500 });
  }
}
