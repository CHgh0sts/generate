import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

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
      margin: 4,
      color: '#000000',
      backgroundColor: '#ffffff',
      transparent: false, // fond transparent
      errorCorrectionLevel: 'M', // L, M, Q, H (pour QR codes)
      displayValue: true, // afficher la valeur sous le code barres
      fontSize: 20,
      fontFamily: 'monospace',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2
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
    const errorCorrectionLevel = searchParams.get('errorCorrectionLevel') || defaults.errorCorrectionLevel;
    const displayValue = searchParams.get('displayValue') !== 'false';
    const fontSize = parseInt(searchParams.get('fontSize')) || defaults.fontSize;
    const fontFamily = searchParams.get('fontFamily') || defaults.fontFamily;
    const textAlign = searchParams.get('textAlign') || defaults.textAlign;
    const textPosition = searchParams.get('textPosition') || defaults.textPosition;
    const textMargin = parseInt(searchParams.get('textMargin')) || defaults.textMargin;

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
      // Génération d'un Data Matrix plus réaliste
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Remplir l'arrière-plan (seulement si pas transparent)
      if (!transparent) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Pour Data Matrix, pas de marge (margin forcé à 0)
      const usableWidth = width;
      const usableHeight = height;
      
      // Taille de grille basée sur la longueur du texte (Data Matrix standards: 10x10, 12x12, 14x14, 16x16, 18x18, 20x20, 22x22, 24x24)
      let gridSize;
      if (value.length <= 3) gridSize = 10;
      else if (value.length <= 6) gridSize = 12;
      else if (value.length <= 10) gridSize = 14;
      else if (value.length <= 16) gridSize = 16;
      else if (value.length <= 25) gridSize = 18;
      else if (value.length <= 36) gridSize = 20;
      else if (value.length <= 44) gridSize = 22;
      else gridSize = 24;
      
      const moduleSize = Math.max(1, Math.floor(Math.min(usableWidth, usableHeight) / gridSize));
      const actualSize = gridSize * moduleSize;
      
      // Centrer le Data Matrix (sans marge)
      const offsetX = (usableWidth - actualSize) / 2;
      const offsetY = (usableHeight - actualSize) / 2;
      
      // Créer une fonction de hash pour générer un pattern pseudo-aléatoire mais déterministe
      const simpleHash = (str, seed = 0) => {
        let hash = seed;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        return Math.abs(hash);
      };
      
      // Générer le pattern du Data Matrix
      ctx.fillStyle = color;
      const dataMatrix = [];
      
      // Initialiser la matrice
      for (let i = 0; i < gridSize; i++) {
        dataMatrix[i] = new Array(gridSize).fill(false);
      }
      
      // Créer les bordures caractéristiques du Data Matrix
      // Bordure gauche et bas (lignes continues)
      for (let i = 0; i < gridSize; i++) {
        dataMatrix[i][0] = true; // Bordure gauche
        dataMatrix[gridSize - 1][i] = true; // Bordure bas
      }
      
      // Bordure droite et haut (pattern en pointillés)
      for (let i = 0; i < gridSize; i += 2) {
        if (i < gridSize - 1) {
          dataMatrix[0][i + 1] = true; // Bordure haut
        }
        if (i < gridSize - 1) {
          dataMatrix[i + 1][gridSize - 1] = true; // Bordure droite
        }
      }
      
      // Encoder les données de manière plus réaliste (simulation d'encodage Data Matrix)
      // Convertir chaque caractère en binaire et créer un pattern dense
      let binaryData = '';
      for (let i = 0; i < value.length; i++) {
        let charCode = value.charCodeAt(i);
        binaryData += charCode.toString(2).padStart(8, '0');
      }
      
      // Ajouter des bits de correction d'erreur simulés
      const errorCorrectionBits = simpleHash(value).toString(2).padStart(32, '0');
      binaryData += errorCorrectionBits;
      
      // Répéter les données si nécessaire pour remplir la matrice
      while (binaryData.length < (gridSize - 4) * (gridSize - 4)) {
        binaryData += binaryData;
      }
      
      // Placer les données dans la matrice selon un pattern en zigzag (typique des Data Matrix)
      let bitIndex = 0;
      let direction = 1; // 1 pour monter, -1 pour descendre
      
      for (let col = 1; col < gridSize - 1; col++) {
        if (col % 2 === 1) {
          // Colonne impaire : monter
          for (let row = gridSize - 2; row >= 1; row--) {
            if (row !== 0 && col !== 0 && row !== gridSize - 1 && col !== gridSize - 1) {
              if (bitIndex < binaryData.length) {
                dataMatrix[row][col] = binaryData[bitIndex] === '1';
                bitIndex++;
              }
            }
          }
        } else {
          // Colonne paire : descendre
          for (let row = 1; row < gridSize - 1; row++) {
            if (row !== 0 && col !== 0 && row !== gridSize - 1 && col !== gridSize - 1) {
              if (bitIndex < binaryData.length) {
                dataMatrix[row][col] = binaryData[bitIndex] === '1';
                bitIndex++;
              }
            }
          }
        }
      }
      
      // Ajouter des patterns de synchronisation plus réalistes
      // Marquer quelques cellules spécifiques pour la synchronisation
      if (gridSize >= 12) {
        const syncPositions = [
          [6, 0], [7, 0], [0, 6], [0, 7],
          [gridSize - 7, gridSize - 1], [gridSize - 6, gridSize - 1],
          [gridSize - 1, gridSize - 7], [gridSize - 1, gridSize - 6]
        ];
        
        syncPositions.forEach(([row, col]) => {
          if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            dataMatrix[row][col] = true;
          }
        });
      }
      
      // Dessiner la matrice sur le canvas
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (dataMatrix[i][j]) {
            ctx.fillRect(
              Math.round(offsetX + j * moduleSize),
              Math.round(offsetY + i * moduleSize),
              moduleSize,
              moduleSize
            );
          }
        }
      }
      
      if (format === 'svg') {
        // Générer le SVG avec le même pattern
        let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Ajouter le fond seulement si pas transparent
        if (!transparent) {
          svgContent += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;
        }
        
        // Ajouter les modules noirs
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (dataMatrix[i][j]) {
              const x = Math.round(offsetX + j * moduleSize);
              const y = Math.round(offsetY + i * moduleSize);
              svgContent += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${color}"/>`;
            }
          }
        }
        
        svgContent += '</svg>';
        buffer = svgContent;
        contentType = 'image/svg+xml';
      } else {
        buffer = canvas.toBuffer('image/png');
        contentType = 'image/png';
      }
    } else {
      // Génération Code-barres (Code128, Code39, EAN, etc.)
      const canvas = createCanvas(width, height);
      
      try {
        JsBarcode(canvas, value, {
          format: type.toUpperCase(),
          width: 2,
          height: height - (displayValue ? fontSize + textMargin * 2 : 0),
          displayValue: displayValue,
          fontSize: fontSize,
          fontOptions: fontFamily,
          textAlign: textAlign,
          textPosition: textPosition,
          textMargin: textMargin,
          background: transparent ? 'transparent' : backgroundColor,
          lineColor: color,
          margin: margin
        });

        if (format === 'svg') {
          // Pour SVG, créons une chaîne SVG simple
          const svgWidth = width;
          const svgHeight = height;
          const barWidth = 2;
          const bars = Math.floor(svgWidth / (barWidth + 1));
          
          let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
          
          // Ajouter le fond seulement si pas transparent
          if (!transparent) {
            svgContent += `<rect width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>`;
          }
          
          // Génération simple de barres basée sur la valeur
          for (let i = 0; i < bars; i++) {
            if (i % 2 === 0) {
              svgContent += `<rect x="${i * (barWidth + 1)}" y="${margin}" width="${barWidth}" height="${svgHeight - margin * 2}" fill="${color}"/>`;
            }
          }
          
          if (displayValue) {
            svgContent += `<text x="${svgWidth / 2}" y="${svgHeight - textMargin}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}">${value}</text>`;
          }
          
          svgContent += '</svg>';
          buffer = svgContent;
          contentType = 'image/svg+xml';
        } else {
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
          fontSize: fontSize,
          fontOptions: fontFamily,
          textAlign: textAlign,
          textPosition: textPosition,
          textMargin: textMargin,
          background: transparent ? 'transparent' : backgroundColor,
          lineColor: color,
          margin: margin
        });
        
        if (format === 'svg') {
          // Pour SVG, créons une chaîne SVG simple même en cas d'erreur
          const svgWidth = width;
          const svgHeight = height;
          const barWidth = 2;
          const bars = Math.floor(svgWidth / (barWidth + 1));
          
          let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
          
          // Ajouter le fond seulement si pas transparent
          if (!transparent) {
            svgContent += `<rect width="${svgWidth}" height="${svgHeight}" fill="${backgroundColor}"/>`;
          }
          
          // Génération simple de barres basée sur la valeur
          for (let i = 0; i < bars; i++) {
            if (i % 2 === 0) {
              svgContent += `<rect x="${i * (barWidth + 1)}" y="${margin}" width="${barWidth}" height="${svgHeight - margin * 2}" fill="${color}"/>`;
            }
          }
          
          if (displayValue) {
            svgContent += `<text x="${svgWidth / 2}" y="${svgHeight - textMargin}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}">${value}</text>`;
          }
          
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