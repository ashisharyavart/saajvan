# Website starter — edit data/site-config.js for your firm name, contact info & team

## Editing firm-specific info (do this first)

All the personal/firm-specific content — **firm name, tagline, contact
email & phone, WhatsApp/Instagram links, location line, and the team
list** — lives in one file:

```
data/site-config.js
```

Open that file, change the values on the right-hand side of each `:`,
save, and refresh the page. You never need to open `index.html` to
update this kind of info — it's read out of `site-config.js` and
injected into the page automatically by `js/script.js` when it loads.

To add or remove a team member, add or remove an entry in the `team`
array in that same file — the team section rebuilds itself from
whatever's in the array, no HTML editing required.

Everything else (service descriptions, portfolio labels, section
headings) is still directly editable inside `index.html`, since that
copy is closer to marketing content than personal/contact info.

---

Layout rhythm (sticky header, intro strip, numbered service rows, closing
CTA banner, footer) is modeled on **belavi.at**. Colour palette (cream
background, terracotta/gold accent, near-black ink, black CTA buttons) is
taken from your reference screenshot. Every video on the site — hero,
intro, services, portfolio — **autoplays once and is not set to loop**, so
each one plays through from empty space to finished design and then
simply stops on its last frame, leaving the transformed room on screen.

## File structure
```
index.html
css/style.css
js/script.js
assets/videos/   ← put your .mp4 files here
assets/images/   ← poster stills + team photos here
```

Open `index.html` directly in a browser to preview, or drop this whole
folder into Google Antigravity / any code editor to keep building.

## Videos you need to shoot or render

Every image slot from the original reference has been swapped for a
`<video>` that should show a space starting **empty** and transforming
into a **fully designed** space (furniture, lighting, materials appearing
progressively — a build-up, not a before/after cut).

| File | Used in | Behaviour |
|---|---|---|
| `assets/videos/hero-transform.mp4` | Hero | Autoplays as soon as the page loads. No loop — plays once and stops on its last (fully designed) frame. Locked-off camera, 1920×1080+, H.264, muted (audio isn't used). |
| `assets/videos/intro-loop.mp4` | Intro strip | Autoplays once when scrolled into view, freezes on last frame |
| `assets/videos/service-residential.mp4` | Service 01 | Autoplays once when scrolled into view, freezes on last frame |
| `assets/videos/service-commercial.mp4` | Service 02 | Autoplays once when scrolled into view, freezes on last frame |
| `assets/videos/service-planning.mp4` | Service 03 | Autoplays once when scrolled into view, freezes on last frame |
| `assets/videos/service-3d.mp4` | Service 04 | Autoplays once when scrolled into view, freezes on last frame |
| `assets/videos/portfolio-*.mp4` (6 files) | Portfolio grid | Autoplays once when scrolled into view, freezes on last frame |

None of these files should be exported with looping in mind — end each
clip on a clean, well-composed final frame, since that's the frame
visitors will actually be left looking at.

Matching poster stills (first frame, as `.jpg`) go in `assets/images/` —
they show instantly while a video is still loading, so the page never
shows a blank box.

## How the autoplay-once videos work (`js/script.js`)

1. The hero video has the HTML `autoplay` attribute and JS also calls
   `.play()` as a safety net for browsers that need playback kicked off
   manually — it starts the moment the page loads.
2. Every other transformation video (intro, services, portfolio) is
   watched with an `IntersectionObserver`: the first time it scrolls into
   view, JS calls `.play()` once, then stops watching it — so visitors
   actually see the empty-to-designed transformation happen as they
   arrive at that section, instead of it playing off-screen.
3. **None of the videos have the `loop` attribute**, so each one simply
   stops on its final frame once playback finishes — that's what leaves
   the "transformed" space on screen.
4. If no video file is present yet, the poster image / background
   gradient is shown instead — nothing breaks.

## What's still placeholder

- All six portfolio videos, four service videos, the intro loop and the
  hero film — swap in your real footage at the paths above.
- Firm name, tagline, contact details, location and team members — all
  edited in **`data/site-config.js`** (see the top of this file).
- Team photos — replace the files at `assets/images/team-*.jpg`, or point
  the `photo` field in `data/site-config.js` at new filenames.
- Copy inside `index.html` (service descriptions, portfolio labels,
  section headings) is a first draft in your voice — edit freely.
