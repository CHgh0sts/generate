import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas, registerFont } from 'canvas';
import bwipjs from 'bwip-js';
import path from 'path';

// Enregistrer la police personnalisée
const fontPath = path.join(process.cwd(), 'src/app/api/generate/font.ttf');
registerFont(fontPath, { family: 'CustomFont' });

// Fonction pour générer une image d'erreur
function generateErrorImage(errorMessage, width = 400, height = 300, format = 'png') {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fond rouge clair
    ctx.fillStyle = '#ffebee';
    ctx.fillRect(0, 0, width, height);
    
    // Bordure rouge
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);
    
    // Icône d'erreur 
    ctx.fillStyle = '#f44336';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', width / 2, 60);
    
    // Titre "ERREUR"
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ERREUR', width / 2, 100);
    
    // Message d'erreur (découpage en lignes)
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    const maxWidth = width - 40;
    const words = errorMessage.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // Afficher les lignes
    const startY = 140;
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + (index * 20));
    });
    
    if (format === 'svg') {
      // Convertir en SVG simple
      const escapedLines = lines.map(line => line.replace(/[<>&"']/g, (c) => {
        return {'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'": '&#39;'}[c];
      }));
      
      const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#ffebee" stroke="#f44336" stroke-width="3"/>
        <text x="${width/2}" y="60" text-anchor="middle" font-family="sans-serif" font-size="40" fill="#f44336">!</text>
        <text x="${width/2}" y="100" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#d32f2f">ERREUR</text>
        ${escapedLines.map((line, index) => 
          `<text x="${width/2}" y="${startY + (index * 20)}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#333">${line}</text>`
        ).join('')}
      </svg>`;
      return { buffer: svgContent, contentType: 'image/svg+xml' };
    } else {
      return { buffer: canvas.toBuffer('image/png'), contentType: 'image/png' };
    }
  } catch (err) {
    // Fallback en cas d'erreur dans la génération d'erreur
    const simpleError = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#ffebee" stroke="#f44336" stroke-width="3"/>
      <text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#333">Erreur de generation</text>
    </svg>`;
    return { buffer: simpleError, contentType: 'image/svg+xml' };
  }
}

// Fonction pour générer le dégradé selon la direction et les couleurs
function generateGradient(gradientColors, gradientDirection, width, height) {
  const colors = gradientColors.split(',').map(c => c.trim());
  
  // Créer les stops du dégradé
  const stops = colors.map((color, index) => {
    const position = index / (colors.length - 1) * 100;
    return `${color} ${position}%`;
  }).join(', ');
  
  let gradientDef = '';
  let gradientId = 'gradient';
  
  switch (gradientDirection) {
    case 'horizontal':
      gradientDef = `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</linearGradient>`;
      break;
    case 'vertical':
      gradientDef = `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</linearGradient>`;
      break;
    case 'diagonal-lr':
      gradientDef = `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</linearGradient>`;
      break;
    case 'diagonal-rl':
      gradientDef = `<linearGradient id="${gradientId}" x1="100%" y1="0%" x2="0%" y2="100%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</linearGradient>`;
      break;
    case 'radial':
      gradientDef = `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</radialGradient>`;
      break;
    case 'conic':
      // Pour SVG, on simule le conique avec un radial
      gradientDef = `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</radialGradient>`;
      break;
    default:
      gradientDef = `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">${colors.map((color, index) => 
        `<stop offset="${index / (colors.length - 1) * 100}%" style="stop-color:${color}"/>`
      ).join('')}</linearGradient>`;
  }
  
  return {
    gradientDef,
    gradientId,
    colors
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres par défaut
    const defaults = {
      value: 'Hello World',
      type: 'qrcode', // qrcode, code128, code39, ean13, ean8, upc, datamatrix, etc.
      format: 'png', // png, svg, jpeg
      width: 500,
      height: 500,
      margin: 1,
      color: '#000000',
      backgroundColor: '#ffffff',
      transparent: false, // fond transparent
      dataMatrixSize: 'auto', // taille forcée pour Data Matrix
      errorCorrectionLevel: 'M', // L, M, Q, H (pour QR codes)
      displayValue: true, // afficher la valeur sous le code barres
      fontSize: 20,
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      textPrefix: '', // préfixe à ajouter avant le texte
      textSuffix: '', // suffixe à ajouter après le texte
      // Paramètres WiFi pour QR codes
      wifiMode: false, // activer le mode WiFi
      wifiSSID: '', // nom du réseau WiFi
      wifiPassword: '', // mot de passe WiFi
      wifiSecurity: 'WPA', // type de sécurité (WPA, WEP, nopass)
      wifiHidden: false, // réseau caché (true/false)
      // Paramètres dégradé
      gradientMode: false, // activer le mode dégradé
      gradientColors: '#000000,#0066cc', // couleurs du dégradé séparées par virgule
      gradientDirection: 'horizontal' // direction du dégradé
    };

    // Récupération des paramètres
    const value = searchParams.get('value') || defaults.value;
    const type = searchParams.get('type') || defaults.type;
    const format = searchParams.get('format') || defaults.format;
    const width = parseInt(searchParams.get('width')) || defaults.width;
    const height = parseInt(searchParams.get('height')) || defaults.height;
    const margin = parseInt(searchParams.get('margin')) || defaults.margin;
    const color = searchParams.get('color') || defaults.color;
    const backgroundColor = searchParams.get('backgroundColor') || defaults.backgroundColor;
    const transparent = searchParams.get('transparent') === 'true';
    const dataMatrixSize = searchParams.get('dataMatrixSize') || defaults.dataMatrixSize;
    const errorCorrectionLevel = searchParams.get('errorCorrectionLevel') || defaults.errorCorrectionLevel;
    const displayValue = searchParams.get('displayValue') !== 'false';
    const fontSize = parseInt(searchParams.get('fontSize')) || defaults.fontSize;
    const textAlign = searchParams.get('textAlign') || defaults.textAlign;
    const textPosition = searchParams.get('textPosition') || defaults.textPosition;
    const textMargin = parseInt(searchParams.get('textMargin')) || defaults.textMargin;
    const textPrefix = searchParams.get('textPrefix') || defaults.textPrefix;
    const textSuffix = searchParams.get('textSuffix') || defaults.textSuffix;
    
    // Paramètres WiFi
    const wifiMode = searchParams.get('wifiMode') === 'true' || defaults.wifiMode;
    const wifiSSID = searchParams.get('wifiSSID') || defaults.wifiSSID;
    const wifiPassword = searchParams.get('wifiPassword') || defaults.wifiPassword;
    const wifiSecurity = searchParams.get('wifiSecurity') || defaults.wifiSecurity;
    const wifiHidden = searchParams.get('wifiHidden') === 'true' || defaults.wifiHidden;
    
    // Paramètres dégradé
    const gradientMode = searchParams.get('gradientMode') === 'true' || defaults.gradientMode;
    const gradientColors = searchParams.get('gradientColors') || defaults.gradientColors;
    const gradientDirection = searchParams.get('gradientDirection') || defaults.gradientDirection;



    // Créer le texte à afficher (avec prefix/suffix) pour les codes-barres
    const displayText = textPrefix + value + textSuffix;

    let buffer;
    let contentType;

    if (type === 'qrcode') {
      // Génération QR Code
      let qrValue = value;
      
      // Si le mode WiFi est activé, créer la chaîne WiFi
      if (wifiMode && wifiSSID) {
        // Format standard WiFi: WIFI:T:WPA;S:nom_reseau;P:mot_de_passe;H:false;;
        const security = wifiSecurity || 'WPA';
        const hidden = wifiHidden ? 'true' : 'false';
        const password = wifiPassword || '';
        
        // Échapper les caractères spéciaux dans SSID et password
        const escapedSSID = wifiSSID.replace(/[\\;,":]/g, '\\$&');
        const escapedPassword = password.replace(/[\\;,":]/g, '\\$&');
        
        qrValue = `WIFI:T:${security};S:${escapedSSID};P:${escapedPassword};H:${hidden};;`;
      }
      
      const options = {
        width: width,
        margin: margin,
        color: {
          dark: color,
          light: transparent ? '#00000000' : backgroundColor // Transparent si activé
        },
        errorCorrectionLevel: errorCorrectionLevel
      };

      if (format === 'svg') {
        let svgString = await QRCode.toString(qrValue, { 
          ...options, 
          type: 'svg',
          scale: 4
        });
        
        // Appliquer le dégradé si activé
        if (gradientMode) {
          const gradient = generateGradient(gradientColors, gradientDirection, width, height);
          
          // Ajouter la définition du dégradé dans l'SVG
          svgString = svgString.replace(
            /<svg([^>]*)>/,
            `<svg$1><defs>${gradient.gradientDef}</defs>`
          );
          
          // Remplacer la couleur unie par le dégradé (fill et stroke)
          svgString = svgString.replace(
            new RegExp(`fill="${color.replace('#', '\\#')}"`, 'g'),
            `fill="url(#${gradient.gradientId})"`
          );
          svgString = svgString.replace(
            new RegExp(`stroke="${color.replace('#', '\\#')}"`, 'g'),
            `stroke="url(#${gradient.gradientId})"`
          );
        }
        
        // Pour SVG transparent, modifier la couleur de fond
        if (transparent) {
          svgString = svgString.replace(/fill="#ffffff"/g, 'fill="transparent"')
                               .replace(/fill="#FFFFFF"/g, 'fill="transparent"')
                               .replace(/fill="white"/g, 'fill="transparent"');
        }
        
        buffer = svgString;
        contentType = 'image/svg+xml';
      } else {
        buffer = await QRCode.toBuffer(qrValue, {
          ...options,
          type: 'png'
        });
        contentType = 'image/png';
      }
    } else if (type === 'datamatrix') {
      // Génération d'un Data Matrix réel avec bwip-js (conforme aux standards ISO/IEC 16022)
      try {
        // Configurer les options pour bwip-js
        const bwipOptions = {
          bcid: 'datamatrix',
          text: value,
          scale: 1,
          // Pas de padding pour Data Matrix (marge forcée à 0)
          padding: 0,
          backgroundcolor: transparent ? undefined : backgroundColor,
          color: color
        };

        // Gérer la taille forcée des Data Matrix
        if (dataMatrixSize !== 'auto') {
          const forcedSize = parseInt(dataMatrixSize);
          // Pour forcer une taille spécifique, on utilise les options rows/columns de bwip-js
          bwipOptions.rows = forcedSize;
          bwipOptions.columns = forcedSize;
        }

      if (format === 'svg') {
        // Générer le SVG avec bwip-js
        let svgString = bwipjs.toSVG(bwipOptions);
        
        // Extraire les dimensions du viewBox pour redimensionner
        const viewBoxMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
        if (viewBoxMatch) {
          const originalWidth = parseInt(viewBoxMatch[1]);
          const originalHeight = parseInt(viewBoxMatch[2]);
          
          // Redimensionner le SVG à nos dimensions souhaitées
          svgString = svgString.replace(
            /width="\d+" height="\d+"/,
            `width="${width}" height="${height}"`
          );
          
          // Calculer le scaling pour maintenir le ratio
          const scale = Math.min(width / originalWidth, height / originalHeight);
          const scaledWidth = originalWidth * scale;
          const scaledHeight = originalHeight * scale;
          const offsetX = (width - scaledWidth) / 2;
          const offsetY = (height - scaledHeight) / 2;
          
          // Encapsuler le contenu dans un groupe avec transformation
          svgString = svgString.replace(
            /<svg[^>]*>/,
            `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
          );
          
          // Ajouter un fond si pas transparent
          if (!transparent) {
            svgString = svgString.replace(
              /(<svg[^>]*>)/,
              `$1<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`
            );
          }
          
          // Appliquer le dégradé si activé
          if (gradientMode) {
            const gradient = generateGradient(gradientColors, gradientDirection, width, height);
            
            // Ajouter la définition du dégradé dans l'SVG
            svgString = svgString.replace(
              /(<svg[^>]*>)/,
              `$1<defs>${gradient.gradientDef}</defs>`
            );
            
            // Remplacer la couleur unie par le dégradé (fill et stroke)
            svgString = svgString.replace(
              new RegExp(`fill="${color.replace('#', '\\#')}"`, 'g'),
              `fill="url(#${gradient.gradientId})"`
            );
            svgString = svgString.replace(
              new RegExp(`stroke="${color.replace('#', '\\#')}"`, 'g'),
              `stroke="url(#${gradient.gradientId})"`
            );
          }
          
          // Ajouter la transformation pour centrer et redimensionner
          svgString = svgString.replace(
            /(<svg[^>]*>(?:<rect[^>]*>)?(?:<defs[^>]*>.*?<\/defs>)?)/,
            `$1<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`
          );
          svgString = svgString.replace('</svg>', '</g></svg>');
        }
        
        // Gérer la transparence en supprimant les fonds blancs
        if (transparent) {
          svgString = svgString.replace(/fill="#ffffff"/gi, 'fill="transparent"');
          svgString = svgString.replace(/fill="white"/gi, 'fill="transparent"');
        }
        
        buffer = svgString;
        contentType = 'image/svg+xml';
      } else {
        // Générer le PNG avec bwip-js
        buffer = await bwipjs.toBuffer({
          ...bwipOptions,
          // Utiliser une échelle raisonnable pour atteindre nos dimensions
          scale: Math.max(1, Math.floor(Math.min(width, height) / 100))
        });
        
        contentType = 'image/png';
      }
      } catch (datamatrixError) {
        // Erreur spécifique à Data Matrix - générer une image d'erreur
        console.error('Erreur Data Matrix:', datamatrixError);
        const errorMsg = `Data Matrix ${dataMatrixSize}x${dataMatrixSize} : Texte trop long pour cette taille. Essayez une taille plus grande ou un texte plus court.`;
        const errorResult = generateErrorImage(errorMsg, width, height, format);
        buffer = errorResult.buffer;
        contentType = errorResult.contentType;
      }
    } else {
      // Génération Code-barres (Code128, Code39, EAN, etc.)
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Utiliser la police personnalisée
      ctx.font = `${fontSize}px CustomFont`;
      
      try {
        if (format === 'svg') {
          // Générer le code-barres sur canvas pour extraire les données
          JsBarcode(canvas, value, {
            format: type.toUpperCase(),
            width: 2,
            height: height - (displayValue ? fontSize + textMargin * 2 : 0),
            displayValue: displayValue,
            text: displayValue ? displayText : '',
            fontSize: fontSize,
            font: 'CustomFont',
            textAlign: textAlign,
            textPosition: textPosition,
            textMargin: textMargin,
            background: transparent ? 'transparent' : backgroundColor,
            lineColor: color,
            margin: margin
          });
          
          // Convertir en SVG avec support du dégradé
          let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
          
          // Ajouter les définitions de dégradé si nécessaire
          if (gradientMode) {
            const gradient = generateGradient(gradientColors, gradientDirection, width, height);
            svgContent += `<defs>${gradient.gradientDef}</defs>`;
          }
          
          if (!transparent) {
            svgContent += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
          }
          
          if (gradientMode) {
            // Créer un masque à partir du canvas et appliquer le dégradé
            const imageData = canvas.toDataURL();
            svgContent += `
              <defs>
                <mask id="barcodeMask">
                  <image x="0" y="0" width="${width}" height="${height}" xlink:href="${imageData}"/>
                </mask>
              </defs>
              <rect x="0" y="0" width="${width}" height="${height}" fill="url(#gradient)" mask="url(#barcodeMask)"/>`;
          } else {
            // Mode couleur normale
            const imageData = canvas.toDataURL();
            svgContent += `<image x="0" y="0" width="${width}" height="${height}" xlink:href="${imageData}"/>`;
          }
          
          svgContent += '</svg>';
          
          buffer = svgContent;
          contentType = 'image/svg+xml';
        } else {
          // Pour PNG, utiliser la bonne syntaxe des paramètres
          JsBarcode(canvas, value, {
            format: type.toUpperCase(),
            width: 2,
            height: height - (displayValue ? fontSize + textMargin * 2 : 0),
            displayValue: displayValue,
            text: displayValue ? displayText : '',
            fontSize: fontSize,
            font: 'CustomFont',
            textAlign: textAlign,
            textPosition: textPosition,
            textMargin: textMargin,
            background: transparent ? 'transparent' : backgroundColor,
            lineColor: color,
            margin: margin
          });
          
          buffer = canvas.toBuffer('image/png');
          contentType = 'image/png';
        }
      } catch (error) {
        // Si le format n'est pas supporté, utiliser Code128 par défaut
        JsBarcode(canvas, value, {
          format: "CODE128",
          width: 2,
          height: height - (displayValue ? fontSize + textMargin * 2 : 0),
          displayValue: displayValue,
          text: displayValue ? displayText : '',
          fontSize: fontSize,
          font: 'CustomFont',
          textAlign: textAlign,
          textPosition: textPosition,
          textMargin: textMargin,
          background: transparent ? 'transparent' : backgroundColor,
          lineColor: color,
          margin: margin
        });
        
        if (format === 'svg') {
          // Convertir le canvas en SVG
          const imageData = canvas.toDataURL();
          let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
          
          if (!transparent) {
            svgContent += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
          }
          
          svgContent += `<image x="0" y="0" width="${width}" height="${height}" xlink:href="${imageData}"/>`;
          svgContent += '</svg>';
          
          buffer = svgContent;
          contentType = 'image/svg+xml';
        } else {
          buffer = canvas.toBuffer('image/png');
          contentType = 'image/png';
        }
      }
    }

    // Retourner l'image générée
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${type}-${value.slice(0, 10)}.${format}"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération:', error);
    
    // Générer un message d'erreur spécifique selon le type d'erreur
    let errorMessage = '';
    const errorType = error.message.toLowerCase();
    
    if (errorType.includes('too much data') || errorType.includes('too large')) {
      errorMessage = `Trop de données pour ce format. Réduisez la taille du texte ou augmentez les dimensions.`;
    } else if (errorType.includes('data matrix') && errorType.includes('size')) {
      const dmSize = searchParams.get('dataMatrixSize') || 'auto';
      const dmValue = searchParams.get('value') || 'texte';
      errorMessage = `Data Matrix ${dmSize}x${dmSize} trop petit pour "${dmValue}". Essayez une taille plus grande ou un texte plus court.`;
    } else if (errorType.includes('invalid') && errorType.includes('character')) {
      const reqType = searchParams.get('type') || 'code';
      errorMessage = `Caractères non supportés pour le type ${reqType.toUpperCase()}. Vérifiez votre texte.`;
    } else if (errorType.includes('ean') || errorType.includes('upc')) {
      const reqType = searchParams.get('type') || 'ean';
      const reqValue = searchParams.get('value') || '';
      errorMessage = `Format ${reqType.toUpperCase()} nécessite exactement ${reqType === 'ean13' ? '13' : reqType === 'ean8' ? '8' : '12'} chiffres. Votre texte: "${reqValue}".`;
    } else if (errorType.includes('wifi')) {
      const reqSSID = searchParams.get('wifiSSID') || 'réseau';
      errorMessage = `Erreur WiFi: Vérifiez le SSID "${reqSSID}" et les paramètres de sécurité.`;
    } else if (errorType.includes('barcode') || errorType.includes('jsbarcode')) {
      const reqType = searchParams.get('type') || 'code-barres';
      const reqValue = searchParams.get('value') || 'texte';
      errorMessage = `Le type de code-barres "${reqType}" n'est pas supporté ou le texte "${reqValue}" n'est pas valide pour ce format.`;
    } else if (errorType.includes('qr') || errorType.includes('qrcode')) {
      errorMessage = `QR Code: Trop de données ou niveau de correction trop élevé. Réduisez le texte ou diminuez le niveau de correction.`;
    } else {
      errorMessage = `Erreur de génération: ${error.message}. Vérifiez vos paramètres.`;
    }
    
    // Récupérer les dimensions et format des paramètres de la requête
    const reqWidth = parseInt(searchParams.get('width')) || 400;
    const reqHeight = parseInt(searchParams.get('height')) || 300;
    const reqFormat = searchParams.get('format') || 'png';
    
    // Générer l'image d'erreur
    const errorResult = generateErrorImage(errorMessage, reqWidth, reqHeight, reqFormat);
    
    return new NextResponse(errorResult.buffer, {
      status: 200, // Status 200 car on retourne bien une image
      headers: {
        'Content-Type': errorResult.contentType,
        'Cache-Control': 'no-cache',
        'Content-Disposition': `inline; filename="error.${reqFormat}"`
      }
    });
  }
}