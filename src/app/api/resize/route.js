import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const width = formData.get('width') ? Number(formData.get('width')) : null;
    const height = formData.get('height') ? Number(formData.get('height')) : null;
    const fit = formData.get('fit') || 'inside';
    const format = (formData.get('format') || 'original').toLowerCase();
    const rotate = formData.get('rotate') ? Number(formData.get('rotate')) : 0;
    const flipH = formData.get('flipH') === 'true';
    const flipV = formData.get('flipV') === 'true';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).replace('.', '').toLowerCase();
    const outputFormat = format === 'original' ? (ext === 'jpg' ? 'jpeg' : ext) : format;
    const baseName = path.basename(file.name, path.extname(file.name));
    const outExt = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = `${baseName}-resized.${outExt}`;

    const meta = await sharp(buffer).metadata();

    let pipeline = sharp(buffer);

    // Rotation
    if (rotate) pipeline = pipeline.rotate(rotate);
    if (flipH) pipeline = pipeline.flop();
    if (flipV) pipeline = pipeline.flip();

    // Resize (optional if only rotate/flip)
    if (width || height) {
      pipeline = pipeline.resize({
        width: width || undefined,
        height: height || undefined,
        fit,
        withoutEnlargement: false,
      });
    }

    if (outputFormat === 'jpeg') pipeline = pipeline.jpeg({ quality: 92 });
    else if (outputFormat === 'png') pipeline = pipeline.png();
    else if (outputFormat === 'webp') pipeline = pipeline.webp({ quality: 92 });
    else if (outputFormat === 'avif') pipeline = pipeline.avif({ quality: 80 });

    const outputBuffer = await pipeline.toBuffer();
    const outMeta = await sharp(outputBuffer).metadata();

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Original-Width': String(meta.width || 0),
        'X-Original-Height': String(meta.height || 0),
        'X-Output-Width': String(outMeta.width || 0),
        'X-Output-Height': String(outMeta.height || 0),
      },
    });
  } catch (error) {
    console.error('Erreur redimensionnement:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du redimensionnement' }, { status: 500 });
  }
}
