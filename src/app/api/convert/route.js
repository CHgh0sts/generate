import { NextResponse } from 'next/server';
import sharp from 'sharp';

const OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'ico', 'bmp'];

// ICO_SIZES_MAP: preset name → list of pixel sizes to embed in the ICO
const ICO_PRESETS = {
  favicon:   [16, 32, 48],
  standard:  [16, 32, 48, 64, 128],
  full:      [16, 32, 48, 64, 128, 256],
};

/**
 * Build a valid ICO binary from an array of PNG buffers.
 * Modern ICO files use PNG data directly (Vista+).
 */
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const HEADER  = 6;          // ICONDIR
  const ENTRY   = 16;         // ICONDIRENTRY per image
  const dirSize = HEADER + count * ENTRY;

  // Compute absolute file offsets for each image
  const offsets = [];
  let pos = dirSize;
  for (const buf of pngBuffers) { offsets.push(pos); pos += buf.length; }

  // ICONDIR header
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4);

  // ICONDIRENTRY × count
  const dir = Buffer.alloc(count * ENTRY);
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const o = i * ENTRY;
    dir.writeUInt8(s >= 256 ? 0 : s, o);      // Width  (0 means 256)
    dir.writeUInt8(s >= 256 ? 0 : s, o + 1);  // Height
    dir.writeUInt8(0, o + 2);                  // ColorCount (0 for true-colour)
    dir.writeUInt8(0, o + 3);                  // Reserved
    dir.writeUInt16LE(1,  o + 4);              // Planes
    dir.writeUInt16LE(32, o + 6);              // BitCount (RGBA)
    dir.writeUInt32LE(pngBuffers[i].length, o + 8);  // SizeInBytes
    dir.writeUInt32LE(offsets[i],           o + 12); // Offset
  }

  return Buffer.concat([header, dir, ...pngBuffers]);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file   = formData.get('file');
    const format = (formData.get('format') || 'png').toLowerCase();
    const icoPreset = (formData.get('icoPreset') || 'full').toLowerCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }
    if (!OUTPUT_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Format invalide. Formats acceptés : ${OUTPUT_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';

    // ── ICO ────────────────────────────────────────────────────
    if (format === 'ico') {
      const sizes = ICO_PRESETS[icoPreset] ?? ICO_PRESETS.full;
      const pngBuffers = await Promise.all(
        sizes.map((s) =>
          sharp(buffer)
            .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer()
        )
      );
      const icoBuffer = buildIco(pngBuffers, sizes);
      return new NextResponse(icoBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/x-icon',
          'Content-Disposition': `attachment; filename="${baseName}.ico"`,
        },
      });
    }

    // ── Standard formats ───────────────────────────────────────
    let pipeline = sharp(buffer);
    switch (format) {
      case 'jpeg': pipeline = pipeline.jpeg({ quality: 90 }); break;
      case 'png':  pipeline = pipeline.png();                 break;
      case 'webp': pipeline = pipeline.webp({ quality: 90 }); break;
      case 'avif': pipeline = pipeline.avif({ quality: 80 }); break;
      case 'gif':  pipeline = pipeline.gif();                 break;
      case 'tiff': pipeline = pipeline.tiff();                break;
      case 'bmp':  pipeline = pipeline.bmp();                 break;
      default:     pipeline = pipeline.png();
    }

    const outputBuffer = await pipeline.toBuffer();
    const extension    = format === 'jpeg' ? 'jpg' : format;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${format === 'jpeg' ? 'jpeg' : format}`,
        'Content-Disposition': `attachment; filename="${baseName}.${extension}"`,
      },
    });
  } catch (error) {
    console.error('Erreur conversion image:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la conversion' },
      { status: 500 }
    );
  }
}
