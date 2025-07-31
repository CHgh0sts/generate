'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [params, setParams] = useState({
    value: 'Hello World',
    type: 'qrcode',
    format: 'png',
    width: 500,
    height: 500,
    margin: 4,
    color: '#000000',
    backgroundColor: '#ffffff',
    transparent: false,
    dataMatrixSize: 'auto',
    errorCorrectionLevel: 'M',
    displayValue: true,
    fontSize: 20,
    fontFamily: 'monospace',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2
  });

  const [imageUrl, setImageUrl] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [fullApiUrl, setFullApiUrl] = useState('');

  const codeTypes = [
    { value: 'qrcode', label: 'QR Code' },
    { value: 'code128', label: 'Code 128' },
    { value: 'code39', label: 'Code 39' },
    { value: 'ean13', label: 'EAN-13' },
    { value: 'ean8', label: 'EAN-8' },
    { value: 'upc', label: 'UPC' },
    { value: 'datamatrix', label: 'Data Matrix' },
  ];

  const formats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
  ];

  const errorLevels = [
    { value: 'L', label: 'Low (L)' },
    { value: 'M', label: 'Medium (M)' },
    { value: 'Q', label: 'Quartile (Q)' },
    { value: 'H', label: 'High (H)' },
  ];

  const fontFamilies = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'Arial', label: 'Arial' },
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans-serif' },
  ];

  const textAlignments = [
    { value: 'left', label: 'Gauche' },
    { value: 'center', label: 'Centre' },
    { value: 'right', label: 'Droite' },
  ];

  const textPositions = [
    { value: 'bottom', label: 'Bas' },
    { value: 'top', label: 'Haut' },
  ];

  const dataMatrixSizes = [
    { value: 'auto', label: 'Auto (basé sur le texte)' },
    { value: '10', label: '10x10' },
    { value: '12', label: '12x12' },
    { value: '14', label: '14x14' },
    { value: '16', label: '16x16' },
    { value: '18', label: '18x18' },
    { value: '20', label: '20x20' },
    { value: '22', label: '22x22' },
    { value: '24', label: '24x24' },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });

    const newApiUrl = `/api/generate?${urlParams.toString()}`;
    setApiUrl(newApiUrl);
    setImageUrl(newApiUrl);
    
    // Définir l'URL complète seulement côté client
    if (typeof window !== 'undefined') {
      setFullApiUrl(`${window.location.origin}${newApiUrl}`);
    }
  }, [params]);

  const handleParamChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(fullApiUrl);
    alert('URL de l&apos;API copiée dans le presse-papier !');
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${params.type}-${params.value.slice(0, 10)}.${params.format}`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Générateur de Codes
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Générez des QR codes, codes barres et data matrix avec de nombreux paramètres personnalisables
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panneau de configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Configuration</h2>
            
            <div className="space-y-4">
              {/* Valeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valeur/Texte
                </label>
                <input
                  type="text"
                  value={params.value}
                  onChange={(e) => handleParamChange('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Type de code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de code
                </label>
                <select
                  value={params.type}
                  onChange={(e) => handleParamChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {codeTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
        </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={params.format}
                  onChange={(e) => handleParamChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {formats.map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Largeur
                  </label>
                  <input
                    type="number"
                    value={params.width}
                    onChange={(e) => handleParamChange('width', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hauteur
                  </label>
                  <input
                    type="number"
                    value={params.height}
                    onChange={(e) => handleParamChange('height', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Couleurs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={params.color}
                    onChange={(e) => handleParamChange('color', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Arrière-plan
                  </label>
                  <input
                    type="color"
                    value={params.backgroundColor}
                    onChange={(e) => handleParamChange('backgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={params.transparent}
                  />
                </div>
              </div>

              {/* Fond transparent */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="transparent"
                  checked={params.transparent}
                  onChange={(e) => handleParamChange('transparent', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="transparent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fond transparent
                </label>
              </div>

              {/* Marge (seulement si pas Data Matrix) */}
              {params.type !== 'datamatrix' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Marge: {params.margin}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={params.margin}
                    onChange={(e) => handleParamChange('margin', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Taille Data Matrix (seulement pour Data Matrix) */}
              {params.type === 'datamatrix' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taille de la matrice
                  </label>
                  <select
                    value={params.dataMatrixSize}
                    onChange={(e) => handleParamChange('dataMatrixSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {dataMatrixSizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Paramètres spécifiques aux QR codes */}
              {params.type === 'qrcode' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Niveau de correction d&apos;erreur
                  </label>
                  <select
                    value={params.errorCorrectionLevel}
                    onChange={(e) => handleParamChange('errorCorrectionLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {errorLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Paramètres spécifiques aux codes barres */}
              {params.type !== 'qrcode' && params.type !== 'datamatrix' && (
                <>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="displayValue"
                      checked={params.displayValue}
                      onChange={(e) => handleParamChange('displayValue', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="displayValue" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Afficher la valeur
                    </label>
                  </div>

                  {params.displayValue && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Taille de police: {params.fontSize}px
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="40"
                          value={params.fontSize}
                          onChange={(e) => handleParamChange('fontSize', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Police
                        </label>
                        <select
                          value={params.fontFamily}
                          onChange={(e) => handleParamChange('fontFamily', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {fontFamilies.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Alignement
                          </label>
                          <select
                            value={params.textAlign}
                            onChange={(e) => handleParamChange('textAlign', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {textAlignments.map(align => (
                              <option key={align.value} value={align.value}>{align.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Position
                          </label>
                          <select
                            value={params.textPosition}
                            onChange={(e) => handleParamChange('textPosition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {textPositions.map(pos => (
                              <option key={pos.value} value={pos.value}>{pos.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Marge texte: {params.textMargin}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={params.textMargin}
                          onChange={(e) => handleParamChange('textMargin', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Panneau d'aperçu et résultats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Aperçu</h2>
            
            {/* Aperçu de l&apos;image */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 mb-6 flex items-center justify-center min-h-[200px]">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Code généré"
                  className="max-w-full max-h-[300px] object-contain"
                  style={{ 
                    backgroundColor: params.backgroundColor,
                    padding: '10px',
                    borderRadius: '4px'
                  }}
                />
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={downloadImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Télécharger
              </button>
              <button
                onClick={copyApiUrl}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Copier URL API
              </button>
            </div>

            {/* URL de l&apos;API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de l&apos;API
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                {fullApiUrl || apiUrl}
              </div>
            </div>

            {/* Exemple d&apos;utilisation */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exemples d&apos;utilisation
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200">
                <div className="mb-2"># QR Code simple:</div>
                <div className="mb-2">/api/generate?value=Hello&type=qrcode</div>
                <div className="mb-2"># Code barres avec couleur:</div>
                <div className="mb-2">/api/generate?value=123456789&type=code128&color=%23ff0000</div>
                <div className="mb-2"># Data Matrix personnalisé:</div>
                <div className="mb-2">/api/generate?value=Test&type=datamatrix&width=300&backgroundColor=%23f0f0f0</div>
                <div className="mb-2"># Data Matrix 24x24 forcé:</div>
                <div className="mb-2">/api/generate?value=ABC&type=datamatrix&dataMatrixSize=24</div>
                <div className="mb-2"># QR Code transparent:</div>
                <div>/api/generate?value=Transparent&type=qrcode&transparent=true&format=png</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}