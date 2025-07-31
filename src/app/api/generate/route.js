import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import bwipjs from 'bwip-js';

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
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      textPrefix: '', // préfixe à ajouter avant le texte
      textSuffix: ''  // suffixe à ajouter après le texte
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
    let fontFamily = searchParams.get('fontFamily') || defaults.fontFamily;
    const textAlign = searchParams.get('textAlign') || defaults.textAlign;
    const textPosition = searchParams.get('textPosition') || defaults.textPosition;
    const textMargin = parseInt(searchParams.get('textMargin')) || defaults.textMargin;
    const textPrefix = searchParams.get('textPrefix') || defaults.textPrefix;
    const textSuffix = searchParams.get('textSuffix') || defaults.textSuffix;

    // Assurer une police fiable pour la production
    const safeFonts = ['Arial', 'Helvetica', 'sans-serif', 'DejaVu Sans', 'Liberation Sans'];
    if (!safeFonts.some(font => fontFamily.includes(font))) {
      fontFamily = 'Arial, Helvetica, sans-serif';
    }

    // Créer le texte à afficher (avec prefix/suffix) pour les codes-barres
    const displayText = textPrefix + value + textSuffix;

    let buffer;
    let contentType;

    if (type === 'qrcode') {
      // Génération QR Code
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
        let svgString = await QRCode.toString(value, { 
          ...options, 
          type: 'svg',
          scale: 4
        });
        
        // Pour SVG transparent, modifier la couleur de fond
        if (transparent) {
          svgString = svgString.replace(/fill="#ffffff"/g, 'fill="transparent"')
                               .replace(/fill="#FFFFFF"/g, 'fill="transparent"')
                               .replace(/fill="white"/g, 'fill="transparent"');
        }
        
        buffer = svgString;
        contentType = 'image/svg+xml';
      } else {
        buffer = await QRCode.toBuffer(value, {
          ...options,
          type: 'png'
        });
        contentType = 'image/png';
      }
    } else if (type === 'datamatrix') {
      // Génération d'un Data Matrix réel avec bwip-js (conforme aux standards ISO/IEC 16022)
      
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
          
          // Ajouter la transformation pour centrer et redimensionner
          svgString = svgString.replace(
            /(<svg[^>]*>(?:<rect[^>]*>)?)/,
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
    } else {
      // Génération Code-barres (Code128, Code39, EAN, etc.)
      const canvas = createCanvas(width, height);
      
      try {
        if (format === 'svg') {
          // Laisser JsBarcode générer directement le SVG
          const svgCanvas = { 
            svg: ''
          };
          
          JsBarcode(svgCanvas, value, {
            format: type.toUpperCase(),
            width: 2,
            height: height - (displayValue ? fontSize + textMargin * 2 : 0),
            displayValue: displayValue,
            text: displayValue ? displayText : '',
            fontSize: fontSize,
            font: fontFamily,
            textAlign: textAlign,
            textPosition: textPosition,
            textMargin: textMargin,
            background: transparent ? 'transparent' : backgroundColor,
            lineColor: color,
            margin: margin,
            xmlDocument: svgCanvas,
            width: width,
            height: height
          });
          
          // JsBarcode pour SVG nécessite une approche différente
          // Utilisons une approche hybride : générer en PNG puis convertir
          JsBarcode(canvas, value, {
            format: type.toUpperCase(),
            width: 2,
            height: height - (displayValue ? fontSize + textMargin * 2 : 0),
            displayValue: displayValue,
            text: displayValue ? displayText : '',
            fontSize: fontSize,
            font: fontFamily,
            textAlign: textAlign,
            textPosition: textPosition,
            textMargin: textMargin,
            background: transparent ? 'transparent' : backgroundColor,
            lineColor: color,
            margin: margin
          });
          
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
          // Pour PNG, utiliser la bonne syntaxe des paramètres
          JsBarcode(canvas, value, {
            format: type.toUpperCase(),
            width: 2,
            height: height - (displayValue ? fontSize + textMargin * 2 : 0),
            displayValue: displayValue,
            text: displayValue ? displayText : '',
            fontSize: fontSize,
            font: fontFamily,
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
          font: fontFamily,
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
    return NextResponse.json(
      { error: 'Erreur lors de la génération du code', details: error.message },
      { status: 500 }
    );
  }
}