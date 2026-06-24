# Deft — marketing site

Static marketing site for **Deft**, a lean clinical-operations platform (Clinical
Training Management + Trial Master File) for biotech startups and lean clinical teams.

Pure HTML/CSS/JS — no build step. Served via GitHub Pages.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

- `index.html` — the page
- `assets/css/styles.css` — design system (tokens) + components
- `assets/js/main.js` — nav, product-explorer tabs, scroll reveals, contact form
- `assets/favicon.svg`

The demo form posts to [Web3Forms](https://web3forms.com); the access key in the form is
public by design and only routes mail to the registered inbox.
