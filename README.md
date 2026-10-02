# Upscale Creations

Company portfolio site. Static (HTML, CSS, JS). No build step. Hosted on Vercel at https://upscale-creations.vercel.app/

```
index.html            home page + the shared logo symbol (#mark)
content.html          Content page: posts from feed.json, empty state until the first one
vercel.json           cleanUrls (content.html is served at /content) and cache headers for fonts, media and brand
css/style.css         black-and-champagne theme; colours are tokens at the top
js/main.js            intro film, starfield, feed, enquiry form; SITE config at the top
content/feed.json     videos on the Content page, plus "Client voices" on the home page
media/work/           portfolio stills (.webp) + the hover film for each card
fonts/                self-hosted fonts; the two "wordmark" files hold only the letters of UPSCALE / CREATIONS
media/content/        videos referenced by feed.json
brand/                logo kit (SVG mark, PNG lockups, favicon, social profile image, og.jpg)
```

## Contact details

Phone (416) 528-3030 and upscalecreationsco@gmail.com are written into `index.html` and `js/main.js`.
TikTok and YouTube are @upscalecreations. Instagram is a placeholder (`__INSTAGRAM_URL__`) and stays hidden until filled in.

The enquiry form posts to FormSubmit (`SITE.formEndpoint` in `js/main.js`), which forwards each
submission to the email. The first submission triggers a one-time activation email; click it once.

## Adding a video

Append an item to `content/feed.json` and put the file in `media/content/`:

```json
{
  "id": "2026-10-05-client-name",
  "type": "content",            // "content" → Content page, "testimonial" → Client voices (home)
  "title": "Opening film: Client",
  "caption": "One or two lines. For testimonials, the client's quote.",
  "client": "Client name",
  "role": "Owner",              // testimonials only, optional
  "date": "2026-10-05",
  "video": "media/content/2026-10-05-client-name.mp4",
  "poster": "media/content/2026-10-05-client-name.jpg",
  "aspect": "9:16",             // or "16:9"
  "tag": "Website film",        // optional badge
  "links": { "instagram": "", "tiktok": "", "youtube": "" }
}
```

Newest first by `date`. The Content page shows a "first drops" empty state until the first content item,
and the "Client voices" section stays hidden until the first testimonial exists.

## Performance notes

- Looping animations pause while their section is off screen (`.is-off`, toggled in `js/main.js`).
- The hero mark's shadow, sheen and satellites use only `transform` / `opacity`, so they run on the compositor.
  Avoid putting a CSS `filter` on the animated mark or animating `background-position`: both repaint every frame.
- The starfield draws in batches and is timed in 60ths of a second, so it behaves the same on 120 Hz screens.
- `media/` and `brand/` are cached for a day. Give a replaced file a new name if it must update at once.
