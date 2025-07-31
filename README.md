# 🎯 Générateur de Codes

Une application web moderne pour générer des QR codes, codes-barres et Data Matrix avec de nombreux paramètres personnalisables.

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black) ![React](https://img.shields.io/badge/React-19.1.0-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC)

## ✨ Fonctionnalités

### 🔲 Types de codes supportés

- **QR Code** - Codes QR avec correction d'erreur configurable
- **Code-barres** - Code 128, Code 39, EAN-13, EAN-8, UPC
- **Data Matrix** - Matrices 2D avec pattern réaliste

### 🎨 Personnalisation complète

- **Couleurs** - Couleur du code et arrière-plan personnalisables
- **Dimensions** - Largeur et hauteur ajustables (par défaut 500x500)
- **Formats** - Export en PNG ou SVG
- **Fond transparent** - Support de la transparence
- **Marges** - Contrôle des espaces (sauf Data Matrix)
- **Texte** - Police, taille, alignement pour les codes-barres

### 🚀 Interface moderne

- Interface utilisateur intuitive avec aperçu en temps réel
- Paramètres organisés par sections
- Exemples d'utilisation intégrés
- Mode sombre/clair compatible
- Responsive design

## 🛠️ Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**

```bash
git clone <url-du-repo>
cd generate
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Lancer le serveur de développement**

```bash
npm run dev
```

4. **Ouvrir dans le navigateur**

```
http://localhost:3000
```

## 📋 Utilisation

### Interface Web

1. Accédez à `http://localhost:3000`
2. Saisissez votre texte/valeur
3. Choisissez le type de code
4. Ajustez les paramètres (couleurs, dimensions, etc.)
5. Téléchargez ou copiez l'URL de l'API

### API REST

L'API est accessible via une route unique : `/api/generate`

#### Endpoint principal

```
GET /api/generate?[paramètres]
```

## 📖 Paramètres de l'API

### Paramètres généraux

| Paramètre         | Type    | Défaut        | Description                  |
| ----------------- | ------- | ------------- | ---------------------------- |
| `value`           | string  | "Hello World" | Texte/valeur à encoder       |
| `type`            | string  | "qrcode"      | Type de code à générer       |
| `format`          | string  | "png"         | Format de sortie             |
| `width`           | number  | 500           | Largeur en pixels            |
| `height`          | number  | 500           | Hauteur en pixels            |
| `color`           | string  | "#000000"     | Couleur du code (hex)        |
| `backgroundColor` | string  | "#ffffff"     | Couleur d'arrière-plan (hex) |
| `transparent`     | boolean | false         | Fond transparent             |

### Types de codes supportés

| Valeur       | Description |
| ------------ | ----------- |
| `qrcode`     | QR Code     |
| `code128`    | Code 128    |
| `code39`     | Code 39     |
| `ean13`      | EAN-13      |
| `ean8`       | EAN-8       |
| `upc`        | UPC         |
| `datamatrix` | Data Matrix |

### Paramètres spécifiques aux QR codes

| Paramètre              | Type   | Défaut | Description                       |
| ---------------------- | ------ | ------ | --------------------------------- |
| `errorCorrectionLevel` | string | "M"    | Niveau de correction (L, M, Q, H) |
| `margin`               | number | 4      | Marge autour du code              |

### Paramètres spécifiques aux codes-barres

| Paramètre      | Type    | Défaut      | Description                     |
| -------------- | ------- | ----------- | ------------------------------- |
| `displayValue` | boolean | true        | Afficher la valeur sous le code |
| `fontSize`     | number  | 20          | Taille de la police             |
| `fontFamily`   | string  | "monospace" | Police utilisée                 |
| `textAlign`    | string  | "center"    | Alignement du texte             |
| `textPosition` | string  | "bottom"    | Position du texte               |
| `textMargin`   | number  | 2           | Marge du texte                  |
| `margin`       | number  | 4           | Marge autour du code            |

### Spécificités des Data Matrix

- **Marge forcée à 0** - Le paramètre `margin` est ignoré
- **Tailles adaptatives** - La grille s'adapte à la longueur du texte (10x10 à 24x24)
- **Pattern réaliste** - Bordures en forme de L caractéristiques

## 🔗 Exemples d'utilisation

### QR Code simple

```
/api/generate?value=Hello&type=qrcode
```

### QR Code personnalisé

```
/api/generate?value=MonSite.com&type=qrcode&color=%23ff0000&backgroundColor=%23f0f0f0&width=300&height=300
```

### Code-barres EAN-13

```
/api/generate?value=1234567890123&type=ean13&format=svg&displayValue=true
```

### Data Matrix

```
/api/generate?value=DATA123&type=datamatrix&width=200&height=200&color=%230066cc
```

### Fond transparent

```
/api/generate?value=Transparent&type=qrcode&transparent=true&format=png
```

### Code-barres avec texte personnalisé

```
/api/generate?value=ABC123&type=code128&fontSize=24&fontFamily=Arial&textAlign=center&color=%23000080
```

## 📁 Structure du projet

```
generate/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.js      # API de génération
│   │   ├── favicon.ico
│   │   ├── globals.css           # Styles globaux
│   │   ├── layout.js             # Layout principal
│   │   └── page.js               # Interface utilisateur
│   └── public/                   # Assets statiques
├── package.json                  # Dépendances et scripts
├── tailwind.config.js           # Configuration Tailwind
├── next.config.mjs              # Configuration Next.js
└── README.md                    # Ce fichier
```

## 🧩 Technologies utilisées

### Framework & Librairies principales

- **Next.js 15.4.5** - Framework React full-stack
- **React 19.1.0** - Interface utilisateur
- **TailwindCSS 4.0** - Styles utilitaires

### Génération de codes

- **qrcode** - Génération des QR codes
- **jsbarcode** - Génération des codes-barres
- **canvas** - Rendu des Data Matrix et manipulation d'images

### APIs

- **Next.js API Routes** - Endpoints REST
- **Canvas API** - Génération d'images côté serveur

## 🎯 Fonctionnalités avancées

### Formats de sortie

- **PNG** - Images bitmap avec support de la transparence
- **SVG** - Vectoriel, redimensionnable sans perte

### Optimisations

- **Cache HTTP** - Réponses mises en cache pendant 1 heure
- **Noms de fichiers automatiques** - Basés sur le type et la valeur
- **Validation des paramètres** - Valeurs par défaut sûres

### Responsive Design

- Interface adaptative desktop/mobile
- Aperçu en temps réel
- Contrôles tactiles optimisés

## 🚦 Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm run start

# Linter
npm run lint
```

## 🔧 Configuration

### Variables d'environnement

Aucune variable d'environnement requise pour le fonctionnement de base.

### Personnalisation

- Modifiez `src/app/page.js` pour l'interface
- Modifiez `src/app/api/generate/route.js` pour l'API
- Ajustez `tailwind.config.js` pour les styles

## 📝 API Response

### Headers de réponse

```
Content-Type: image/png | image/svg+xml
Cache-Control: public, max-age=3600
Content-Disposition: inline; filename="[type]-[value].[format]"
```

### Codes d'erreur

- **200** - Succès
- **500** - Erreur de génération (avec détails JSON)

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajouter une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

1. Consultez la documentation
2. Vérifiez les exemples d'utilisation
3. Ouvrez une issue sur GitHub

---

**Développé avec ❤️ en utilisant Next.js et React**
