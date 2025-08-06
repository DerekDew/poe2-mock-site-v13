PoE2 Flips Dashboard v13 — Frontend (pre-set API base)
Generated: 2025-08-06T05:14:29.254410

API base is preset to:
https://poe2-api-live-v13.onrender.com

Files:
- index.html
- styles.css
- app.js

Deploy (GitHub -> Netlify)
1) Create a public GitHub repo named: poe2-mock-site-v13
2) Upload these three files at the repo ROOT (no subfolders).
3) In Netlify: Add new site -> Import from Git -> select repo.
   - Build command: (leave blank)
   - Publish directory: /
4) Deploy. Visit your Netlify URL and confirm requests to /deals are 200.

CORS
If you see CORS errors, set on your Render backend:
CORS_ORIGINS=https://<your-netlify-domain>
Then redeploy backend and hard refresh your site (Ctrl/Cmd+Shift+R).

Notes
- The Deals table filters in-browser by search, min score, and min margin.
- Watchlist is stored locally in the browser (localStorage).
- Auto-refresh can be enabled in Settings (default off).
