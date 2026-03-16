import { NextResponse } from 'next/server';
import { optimize } from 'svgo';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { svg, plugins } = await req.json();
    if (!svg || typeof svg !== 'string') {
      return NextResponse.json({ error: 'SVG requis' }, { status: 400 });
    }

    const activePlugins = [
      'removeComments',
      'removeMetadata',
      'removeEmptyAttrs',
      'removeEmptyContainers',
      'removeUselessDefs',
      'cleanupIds',
      'collapseGroups',
      'removeHiddenElems',
      'removeUnusedNS',
    ];

    const optPlugins = [
      { name: 'removeDoctype',        active: plugins?.removeDoctype        ?? true },
      { name: 'removeXMLProcInst',    active: plugins?.removeXMLProcInst    ?? true },
      { name: 'removeViewBox',        active: plugins?.removeViewBox        ?? false },
      { name: 'convertColors',        active: plugins?.convertColors        ?? true },
      { name: 'cleanupNumericValues', active: plugins?.cleanupNumericValues ?? true },
      { name: 'mergePaths',           active: plugins?.mergePaths           ?? true },
      { name: 'convertShapeToPath',   active: plugins?.convertShapeToPath   ?? false },
      { name: 'removeAttrs',          active: false },
    ];

    const result = optimize(svg, {
      plugins: [
        ...activePlugins,
        ...optPlugins.filter(p => p.active).map(p => p.name),
      ],
      js2svg: { pretty: plugins?.pretty ?? false, indent: 2 },
    });

    const originalSize  = new TextEncoder().encode(svg).length;
    const optimizedSize = new TextEncoder().encode(result.data).length;
    const saving        = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    return NextResponse.json({
      svg:           result.data,
      originalSize,
      optimizedSize,
      saving:        +saving,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
