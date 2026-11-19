# Arabyo

Arabyo is a free website that teaches Arabic-speaking children born in Sweden to read and write Modern Standard Arabic with full vowel marks (tashkeel). All learning happens through games, across 9 levels based on the child's ability rather than age.

- **Offline-first:** installs on the device and works without internet.
- **No accounts, no server:** progress stays on the device.
- **No AI** and no outside services of any kind.

**Live site:** [https://hagraeso.github.io/Arabyo/](https://hagraeso.github.io/Arabyo/) · **Repository:** [https://github.com/Hagraeso/Arabyo](https://github.com/Hagraeso/Arabyo)

The curriculum is in [docs/curriculum.md](docs/curriculum.md) and is owned by the project owner; changes to it are made in the original source document first.

## Status

Step 1: an empty app shell that installs and works offline. No games or content yet.

## Run locally

Plain HTML, CSS and JavaScript — no build step. From the project folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Service workers work on `localhost`, so you can test offline in desktop browser DevTools (Network → Offline, then reload).

Installing on an iPad (Safari → Share → Add to Home Screen) and testing offline there need the site served over **HTTPS** — see [Publishing](#publishing). All paths are relative, so the app also works from a subfolder.

## Publishing

The site is published with GitHub Pages straight from the repository, with no build step and no workflow.

- In the repository on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` → `/ (root)` → Save**.
- The site is then live at [https://hagraeso.github.io/Arabyo/](https://hagraeso.github.io/Arabyo/). GitHub Pages serves it over **HTTPS**, which iPad Safari needs to install it (Share → Add to Home Screen) and run it offline.
- The empty `.nojekyll` file tells GitHub Pages to serve the files as they are, without Jekyll processing.
- Whenever you change any app-shell file (anything in the `SHELL` list in `sw.js`, or `sw.js` itself), bump the `CACHE` version in `sw.js` so installed devices pick up the update.

## License

- **Code:** MIT — see [LICENSE](LICENSE).
- **Content** (images, audio, text): CC BY-SA 4.0 — see [LICENSE-CONTENT.md](LICENSE-CONTENT.md). Sources are listed in [CREDITS.md](CREDITS.md).
