import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';

const SUPPORTED = ['jpeg', 'jpg', 'png', 'webp', 'avif'];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const quality = Math.min(100, Math.max(1, Number(formData.get('quality') || 80)));
    const format = (formData.get('format') || 'original').toLowerCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).replace('.', '').toLowerCase();
    const outputFormat = format === 'original' ? (ext === 'jpg' ? 'jpeg' : ext) : format;

    if (!SUPPORTED.includes(outputFormat)) {
      return NextResponse.json({ error: `Format non supporté: ${outputFormat}` }, { status: 400 });
    }

    const baseName = path.basename(file.name, path.extname(file.name));
    const outExt = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = `${baseName}-compressed.${outExt}`;

    let pipeline = sharp(buffer);
    if (outputFormat === 'jpeg') pipeline = pipeline.jpeg({ quality });
    else if (outputFormat === 'png') pipeline = pipeline.png({ quality });
    else if (outputFormat === 'webp') pipeline = pipeline.webp({ quality });
    else if (outputFormat === 'avif') pipeline = pipeline.avif({ quality });

    const outputBuffer = await pipeline.toBuffer();

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Original-Size': String(buffer.length),
        'X-Compressed-Size': String(outputBuffer.length),
      },
    });
  } catch (error) {
    console.error('Erreur compression:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la compression' }, { status: 500 });
  }
}
