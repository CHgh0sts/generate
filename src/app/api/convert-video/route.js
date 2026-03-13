import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Résolution du binaire ffmpeg-static au runtime (contourne la transformation Turbopack)
const ffmpegBin = path.resolve(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
ffmpeg.setFfmpegPath(ffmpegBin);

const OUTPUT_FORMATS = ['mp4', 'webm', 'avi', 'mov', 'gif'];

export async function POST(request) {
  let inputPath;
  let outputPath;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const format = (formData.get('format') || 'mp4').toLowerCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Aucune vidéo fournie' }, { status: 400 });
    }

    if (!OUTPUT_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Format invalide. Formats acceptés: ${OUTPUT_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.mp4';
    const baseName = path.basename(file.name, ext) || 'video';

    inputPath = path.join(os.tmpdir(), `convert-video-in-${Date.now()}${ext}`);
    outputPath = path.join(os.tmpdir(), `convert-video-out-${Date.now()}.${format}`);

    await fs.writeFile(inputPath, buffer);

    await new Promise((resolve, reject) => {
      const cmd = ffmpeg(inputPath).output(outputPath).format(format);

      if (format === 'gif') {
        cmd.outputOptions(['-vf', 'fps=10,scale=320:-1:flags=lanczos']);
      }

      cmd.on('end', resolve).on('error', reject).run();
    });

    const outputBuffer = await fs.readFile(outputPath);
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});

    const contentType = format === 'mp4' ? 'video/mp4' : format === 'webm' ? 'video/webm' : format === 'gif' ? 'image/gif' : `video/${format}`;
    const extension = format === 'mp4' ? 'mp4' : format;
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
    console.error('Erreur conversion vidéo:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la conversion' },
      { status: 500 }
    );
  }
}
