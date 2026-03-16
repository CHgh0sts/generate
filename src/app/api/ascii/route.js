import { NextResponse } from 'next/server';
import figlet from 'figlet';

export async function POST(req) {
  try {
    const { text, font = 'Standard' } = await req.json();
    if (!text || text.length > 60) {
      return NextResponse.json({ error: 'Texte invalide (max 60 chars)' }, { status: 400 });
    }
    const result = await new Promise((resolve, reject) => {
      figlet.text(text, { font }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Police non disponible' }, { status: 400 });
  }
}
