# Upscale Creations

Company portfolio site. Static (HTML, CSS, JS). No build step. Hosted on Vercel at https://upscale-creations.vercel.app/

```
index.html            page + the shared logo symbol (#mark)
css/style.css         black-and-champagne theme; colours are tokens at the top
js/main.js            intro film, starfield, feed, enquiry form; SITE config at the top
content/feed.json     videos shown under "Latest content" and "Client voices"
media/work/           portfolio thumbnails + Shastha card film
media/content/        videos referenced by feed.json
brand/                logo kit (SVG mark, PNG lockups, favicon, social profile image, og.jpg)
```

## Contact details

Phone (416) 528-3030 and upscalecreationsco@gmail.com are written into `index.html` and `js/main.js`.
Social links are placeholders (`__INSTAGRAM_URL__`, `__TIKTOK_URL__`, `__YOUTUBE_URL__`) and stay hidden until filled in.

The enquiry form posts to FormSubmit (`SITE.formEndpoint` in `js/main.js`), which forwards each
submission to the email. The first submission triggers a one-time activation email; click it once.

## Adding a video

Append an item to `content/feed.json` and put the file in `media/content/`:

```json
{
  "id": "2026-10-05-client-name",
  "type": "content",            // "content" → Latest content, "testimonial" → Client voices
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

Newest first by `date`. The "Client voices" section stays hidden until the first testimonial exists.
