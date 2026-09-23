# Exercise Blocks

A tiny, dependency-free web app: pick how many minutes you have, get that many
randomized 5-minute exercise blocks, time them, check them off, and see progress.

No build step and no server. It's plain HTML/CSS/JS, so it runs on GitHub Pages as-is.

## Files

| File | What it is |
| --- | --- |
| `exercises.js` | The exercise library, including progressions. **This is the file you edit most.** |
| `app.js` | The app: randomizer, timer, logging, history, progressions. |
| `style.css` | All styling. Colors are variables at the top. |
| `index.html` | The page shell and phone/home-screen meta tags. |
| `manifest.webmanifest`, `*.png` | Home-screen app name and icons. |
| `sw.js` | Lets the app open offline after the first visit. |

## Updating exercises

Edit `exercises.js` (the format is documented at the top of the file), then commit
and push. GitHub Pages redeploys in about a minute, and everyone gets the change the
next time they open the app. Saved history and levels refer to exercise `id`s, so
**never rename an `id`** once people have history.

## Publishing on GitHub Pages

1. Push this repo to GitHub (free accounts need the repo to be public for Pages).
2. Repo **Settings → Pages → Build and deployment**: Source **Deploy from a branch**,
   branch **main**, folder **/ (root)**.
3. The site appears at `https://<username>.github.io/<repo>/`.

All paths in the app are relative, so it works under that `/<repo>/` sub-path.

## "Request a harder level" (optional)

When someone reaches the top level of an exercise, the app can send you a note. It
posts to a form service, which emails you, so your address never appears in the
site or repo.

1. Create a form at [Formspree](https://formspree.io) that forwards to your inbox.
2. Paste its URL (`https://formspree.io/f/xxxxxxxx`) into `REQUEST_ENDPOINT` at the
   top of `app.js`.

Until that is set, the request button is hidden.

## Using it on an iPhone

Open the site in Safari, tap **Share → Add to Home Screen**. It then opens full-screen
like an app.

- Progress is stored **on that device**, in the browser. Phone and laptop keep
  separate histories.
- Use the **Export** button on the History tab now and then to save a backup, and
  **Import** to restore it.
- The home-screen app has its own storage, separate from Safari. Add it to the Home
  Screen first, then start using it, so nothing is left behind in Safari.
- The screen stays awake while a timer runs. The chime follows the phone's ring/silent
  switch, and vibration isn't available on iPhone.
