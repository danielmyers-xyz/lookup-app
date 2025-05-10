# Marin County Zoning Lookup Tool

This is a lightweight, browser-based GIS app built with the [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/) that allows users to look up zoning and general plan designations for parcels in Marin County, CA.

👉 Try it live: [danielmyersxyz.github.io/lookup-app](https://danielmyersxyz.github.io/lookup-app)

## 🗺️ Features

- Address and Parcel ID search with autocomplete
- Click map to identify intersecting parcel, zoning, and general plan data
- Sidebar panel displays attribute details
- Automatically zooms to selected geometry
- Dynamic layer visibility based on zoom level
- Fully client-side — no backend required

## 🧱 Tech Stack

- HTML + CSS + Vanilla JavaScript
- ArcGIS API for JavaScript v4.27 (CDN)
- Feature layers hosted on ArcGIS Online
- Deployed with GitHub Pages

## 📁 Project Structure

```
.
├── index.html      # Main layout and ArcGIS widget containers
├── app.js          # Core app logic and layer queries
├── style.css       # UI styling and responsive layout
```

## 🚀 Deployment

This app is statically hosted via [GitHub Pages](https://pages.github.com/).  
Every push to `main` automatically updates:

```
https://danielmyersxyz.github.io/lookup-app/
```

To test locally:

```bash
cd lookup-app
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

## 📝 License

MIT License.  
Data and API access subject to Marin County and ArcGIS Online usage terms.
