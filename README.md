# Arabyo

Arabyo is a free website that teaches Arabic-speaking children born in Sweden to read and write Modern Standard Arabic with full vowel marks (tashkeel). All learning happens through games, across 9 levels based on the child's ability rather than age.

- **Offline-first:** installs on the device and works without internet.
- **No accounts, no server:** progress stays on the device.
- **No AI** and no outside services of any kind.

The curriculum is in [docs/curriculum.md](docs/curriculum.md) and is owned by the project owner; changes to it are made in the original source document first.

## Status

Step 1: an empty app shell that installs and works offline. No games or content yet.

## Run locally

Plain HTML, CSS and JavaScript — no build step. From the project folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Service workers work on `localhost`, so you can test offline in desktop browser DevTools (Network → Offline, then reload).

Installing on an iPad (Safari → Share → Add to Home Screen) and testing offline there need the site served over **HTTPS**, for example via GitHub Pages. All paths are relative, so the app also works from a subfolder.

## License

- **Code:** MIT — see [LICENSE](LICENSE).
- **Content** (images, audio, text): CC BY-SA 4.0 — see [LICENSE-CONTENT.md](LICENSE-CONTENT.md). Sources are listed in [CREDITS.md](CREDITS.md).
