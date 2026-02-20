

# Add PWA Install Support to Exported Digital Card HTML

## What This Does

When you export a Digital card as HTML, the downloaded file will be installable as a home-screen app on both iOS and Android. The app icon will be automatically generated using the card's primary color as the background and the person's initials as the icon text -- matching the card's branding.

## How It Works

The exported HTML file is a standalone single file. Since there's no server hosting separate manifest/icon files, everything will be embedded inline using data URIs:

1. **Inline SVG Icon** -- A 512x512 SVG icon generated from the card's primary color (background) and the person's initials (white text), encoded as a data URI
2. **Inline Web App Manifest** -- A JSON manifest embedded as a `data:application/json` link, referencing the inline icon
3. **Inline Service Worker** -- A minimal service worker registered via a Blob URL so the browser recognizes the page as installable
4. **iOS Meta Tags** -- Apple-specific meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`) for Add to Home Screen support on Safari

## Technical Details

**File to edit:** `src/components/corporate-suite/BusinessCardDesigner.tsx`

**Changes to the `exportDigitalCardAsHtml` function (lines 1089-1163):**

In the `<head>` section, add:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<link rel="apple-touch-icon" href="DATA_URI_SVG_ICON">`
- `<link rel="manifest" href="DATA_URI_MANIFEST">`

The manifest JSON will contain:
```text
{
  "name": "[Person Name] — Digital Card",
  "short_name": "[Initials] Card",
  "start_url": ".",
  "display": "standalone",
  "background_color": "[primary color]",
  "theme_color": "[primary color]",
  "icons": [{ "src": "DATA_URI_SVG", "sizes": "any", "type": "image/svg+xml" }]
}
```

The SVG icon template:
```text
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="[primaryColor]"/>
  <text x="256" y="300" text-anchor="middle" 
    font-family="[fontFamily]" font-size="200" font-weight="700" 
    fill="#ffffff">[INITIALS]</text>
</svg>
```

At the bottom of the `<script>` block, add a service worker registration:
```text
if('serviceWorker' in navigator){
  var sw='self.addEventListener("fetch",function(e){e.respondWith(fetch(e.request))})';
  var blob=new Blob([sw],{type:'application/javascript'});
  navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(function(){});
}
```

**Helper logic** (added before the HTML template string):
- Extract initials from the name (first letter of first + last word, uppercase)
- Build the SVG string, then encode to a data URI
- Build the manifest JSON object, then encode to a `data:application/json;base64,...` URI

All changes are contained within the single `exportDigitalCardAsHtml` function -- no new files or dependencies needed.

