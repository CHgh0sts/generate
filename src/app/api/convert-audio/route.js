import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Résolution du binaire ffmpeg-static au runtime (contourne la transformation Turbopack)
const ffmpegBin = path.resolve(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
ffmpeg.setFfmpegPath(ffmpegBin);

const OUTPUT_FORMATS = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'];

export async function POST(request) {
  let inputPath;
  let outputPath;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const format = (formData.get('format') || 'mp3').toLowerCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucun fichier audio fourni' }, { status: 400 });
    }

    if (!OUTPUT_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Format invalide. Formats acceptés: ${OUTPUT_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.mp3';
    const baseName = path.basename(file.name, ext) || 'audio';

    inputPath = path.join(os.tmpdir(), `convert-audio-in-${Date.now()}${ext}`);
    const outExt = format === 'm4a' ? 'm4a' : format;
    outputPath = path.join(os.tmpdir(), `convert-audio-out-${Date.now()}.${outExt}`);

    await fs.writeFile(inputPath, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .format(format)
        .audioBitrate(128)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const outputBuffer = await fs.readFile(outputPath);
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});

    const contentType = format === 'mp3' ? 'audio/mpeg' : format === 'm4a' ? 'audio/mp4' : format === 'ogg' ? 'audio/ogg' : `audio/${format}`;
    const extension = format === 'm4a' ? 'm4a' : format;
    const filename = `${baseName}.${extension}`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
    console.error('Erreur conversion audio:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la conversion' },
      { status: 500 }
    );
  }
}
