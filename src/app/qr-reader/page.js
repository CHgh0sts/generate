'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { Upload, Camera, X, Copy, Check, AlertTriangle, QrCode, ExternalLink } from 'lucide-react';
import { useToast } from '../Toast';

const ACCENT = '#06b6d4';

const FORMAT_LABELS = {
  QR_CODE: 'QR Code',
  DATA_MATRIX: 'Data Matrix',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  EAN_13: 'EAN-13',
  EAN_8: 'EAN-8',
  UPC_A: 'UPC-A',
  UPC_E: 'UPC-E',
  CODABAR: 'Codabar',
  ITF: 'ITF',
  PDF_417: 'PDF417',
  AZTEC: 'Aztec',
};

async function decodeWithZxing(imageData) {
  const { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, MultiFormatReader, BarcodeFormat, DecodeHintType, NotFoundException } = await import('@zxing/library');
  const { data, width, height } = imageData;
  const luminances = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    luminances[i] = ((r + g * 2 + b) / 4) & 0xff;
  }
  const source = new RGBLuminanceSource(luminances, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    BarcodeFormat.CODABAR, BarcodeFormat.ITF, BarcodeFormat.PDF_417, BarcodeFormat.AZTEC,
  ]);
  try {
    const result = reader.decode(bitmap, hints);
    const fmt = result.getBarcodeFormat();
    const fmtName = typeof fmt === 'number' ? BarcodeFormat[fmt] : fmt;
    return { data: result.getText(), format: fmtName };
  } catch (e) {
    if (e.name === 'NotFoundException' || e.constructor?.name === 'NotFoundException') return null;
    throw e;
  }
}

async function decodeFromCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const zxingResult = await decodeWithZxing(imageData);
  if (zxingResult) return zxingResult;
  const jsQR = (await import('jsqr')).default;
  const qr = jsQR(imageData.data, imageData.width, imageData.height);
  return qr ? { data: qr.data, format: 'QR_CODE' } : null;
}

export default function QrReaderPage() {
  const [result, setResult]   = useState(null);
  const [format, setFormat]   = useState(null);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [history, setHistory] = useState([]);

  const canvasRef  = useRef();
  const videoRef   = useRef();
  const fileRef    = useRef();
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const pushToast  = useToast();

  function processResult(code) {
    if (code?.data) {
      setResult(code.data);
      setFormat(code.format || 'QR_CODE');
      setError('');
      setHistory(h => [{ data: code.data, format: code.format || 'QR_CODE' }, ...h.filter(x => x.data !== code.data)].slice(0, 10));
      pushToast?.('Code décodé !');
    } else {
      setResult(null);
      setFormat(null);
      setError('Aucun QR code, Data Matrix ou code-barres détecté dans cette image.');
    }
  }

  async function handleFile(file) {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const canvas = canvasRef.current;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const code = await decodeFromCanvas(canvas);
      processResult(code);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  }

  // Camera scanning
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      scanLoop();
    } catch (e) {
      setError('Impossible d\'accéder à la caméra : ' + e.message);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  const scanLoop = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop); return;
    }
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    decodeFromCanvas(canvas).then(code => {
      if (code?.data && code.data !== result) {
        processResult(code);
        stopCamera();
      } else {
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    }).catch(() => { rafRef.current = requestAnimationFrame(scanLoop); });
  }, [result]);

  useEffect(() => () => stopCamera(), []);

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true); pushToast?.('Copié !');
    setTimeout(() => setCopied(false), 2000);
  }

  const isUrl = result && /^https?:\/\//i.test(result);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="border-b border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <div>
              <h1 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Lecteur QR Code, Data Matrix & codes-barres</h1>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">QR Code, Data Matrix, Code 128, EAN, UPC… image ou caméra</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => fileRef.current?.click()}
            style={{ backgroundColor: ACCENT }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90">
            <Upload className="w-4 h-4" /> Importer une image
          </button>
          <button onClick={cameraOn ? stopCamera : startCamera}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border transition-colors ${cameraOn ? 'bg-red-500 text-white border-transparent hover:bg-red-600' : 'border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]'}`}>
            <Camera className="w-4 h-4" />
            {cameraOn ? 'Arrêter' : 'Caméra'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} className="hidden" />
        </div>

        {/* Camera / Drop zone */}
        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="bg-white dark:bg-[#171717] rounded-xl border-2 border-dashed border-[#e5e5e5] dark:border-[#262626] overflow-hidden"
        >
          {cameraOn ? (
            <div className="relative">
              <video ref={videoRef} playsInline className="w-full rounded-xl" />
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-cyan-400 rounded-xl opacity-70" />
              </div>
            </div>
          ) : preview ? (
            <div className="relative">
              <img src={preview} alt="QR" className="w-full object-contain max-h-64 mx-auto" />
              <button onClick={() => { setPreview(null); setResult(null); setError(''); }}
                className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/60 rounded-full hover:bg-white dark:hover:bg-black">
                <X className="w-4 h-4 text-[#525252]" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#a3a3a3]">
              <QrCode className="w-10 h-10 opacity-30" />
              <p className="text-sm">Glissez une image ici ou cliquez pour l&apos;importer</p>
              <p className="text-xs">PNG, JPG, WebP, GIF…</p>
            </div>
          )}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Result */}
        {loading && (
          <div className="text-center text-sm text-[#a3a3a3] py-4">Lecture du code…</div>
        )}

        {result && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#a3a3a3]">Résultat</span>
              {format && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT + '20', color: ACCENT }}>
                  {FORMAT_LABELS[format] || format}
                </span>
              )}
              <span className="ml-auto flex gap-2">
                <button onClick={copy} className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copier
                </button>
                {isUrl && (
                  <a href={result} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                    Ouvrir
                  </a>
                )}
                <Link href={`/generate?value=${encodeURIComponent(result)}&type=${({ DATA_MATRIX:'datamatrix', CODE_128:'code128', CODE_39:'code39', EAN_13:'ean13', EAN_8:'ean8', UPC_A:'upc', UPC_E:'upc' })[format] || 'qrcode'}`}
                  className="flex items-center gap-1 text-[10px] border border-[#e5e5e5] dark:border-[#262626] rounded px-2 py-1 text-[#737373] hover:bg-[#f5f5f5] dark:hover:bg-[#262626]">
                  <ExternalLink className="w-3 h-3" /> Générer
                </Link>
              </span>
            </div>
            <div className="font-mono text-sm text-[#171717] dark:text-[#ededed] break-all bg-[#fafafa] dark:bg-[#0a0a0a] rounded-lg p-3">
              {result}
            </div>
            {isUrl && (
              <a href={result} target="_blank" rel="noopener noreferrer"
                className="text-xs underline" style={{ color: ACCENT }}>{result}</a>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4">
            <p className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] mb-3">Historique</p>
            <ul className="space-y-1">
              {history.slice(1).map((h, i) => {
                const data = typeof h === 'string' ? h : h?.data;
                const fmt = typeof h === 'object' && h?.format ? FORMAT_LABELS[h.format] : null;
                return data ? (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#525252] dark:text-[#a3a3a3]">
                    <QrCode className="w-3 h-3 shrink-0 text-[#a3a3a3]" />
                    {fmt && <span className="text-[10px] shrink-0 opacity-70">{fmt}</span>}
                    <span className="flex-1 font-mono truncate">{data}</span>
                    <button onClick={() => { navigator.clipboard.writeText(data); pushToast?.('Copié !'); }}
                      className="text-[#a3a3a3] hover:text-[#525252] shrink-0">
                      <Copy className="w-3 h-3" />
                    </button>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
