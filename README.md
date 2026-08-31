# kaijuhaanpaa.com

The website of artist Kaiju Haanpää. Plain HTML, CSS and JavaScript — no
WordPress, no frameworks, **no libraries of any kind**, and no build step for the
pages. Any web host that can serve files will run it.

## Layout of the repository

```
index.html            Gallery     ─┐
books/index.html      Books        │ Hand-written. Edit these directly;
cv/index.html         CV           │ nothing generates them.
contact/index.html    Contact     ─┘

css/style.css         All styling. Sectioned and commented; start at the
                      design tokens under "1. Design tokens".

js/site.js            Entry point. Every page loads just this one file.
js/shell.js           The shared header, navigation and footer.
js/content.js         Turns the data files into page content.
js/images.js          Picks the right image size and builds the srcset.
js/lightbox.js        Click-to-enlarge overlay.

content/gallery.json  The artworks, grouped by year.
content/books.json    The books.
content/cv.json       The CV.
content/images.json   Generated list of image dimensions. Don't edit by hand.

images/header/        The wide banner across the top of every page, cut from
                      one of the masters with tools/make-banner.sh.
images/original/      Full-size masters, exactly as downloaded. 138 files.
images/500/           Web copies, 500px wide  (the "medium" size)
images/700/           Web copies, 700px wide  (the "large" size)
images/1400/          Web copies, 1400px wide (retina screens and lightbox)

work/                 A small page per artwork, so a link shared in WhatsApp
                      previews the right picture. Generated — don't edit.

tools/                Scripts — see below.
```

## No dependencies, ever

There is no `package.json`, no `node_modules`, no bundler and no minifier. The
JavaScript files in `js/` are exactly the files the browser runs — about 550
lines you can read straight through.

The site loads **nothing from anywhere else**: no CDN scripts, no web fonts, no
analytics. Its only external link is the artist's own address on the Contact
page. Nothing here can develop a security hole that needs patching, because
there is no third-party code in it.

## Previewing locally

```sh
sh tools/serve.sh          # then open http://localhost:8000
```

**This is required** — you cannot open the files straight off the disk any more.
Browsers block `fetch()` and JavaScript modules on `file://` addresses, so a page
opened that way shows only its heading. Serving it locally takes one command.

## Everyday editing

### Changing text, captions or the order of works

Edit the matching file in `content/` and reload the page. **There is nothing to
build.**

| To change… | Edit |
| --- | --- |
| An artwork's caption or size | `content/gallery.json` |
| The books | `content/books.json` |
| The CV | `content/cv.json` |
| The contact details | `contact/index.html` (it is only a few lines, so it lives in the page) |
| The menu, site title or footer | `js/shell.js` |
| Anything about how it looks | `css/style.css` |

### Changing how big a picture is shown

Each artwork has a `"size"` in `content/gallery.json` — either `"large"` or
`"medium"`. Change the word and reload. **Nothing is regenerated and nothing is
ever blurry**: all three widths already exist in `images/`, so switching sizes
just points at a file that is already there.

### Changing what "large" and "medium" mean

The two widths are defined in exactly one place — the tokens at the top of
`css/style.css`:

```css
--width-large:  700px;
--width-medium: 500px;
```

`js/images.js` reads those values out of the stylesheet at run time, so every
image's `src`, `width`, `height` and `srcset` follows automatically. There is no
second copy of the number to keep in step.

If you make a size *larger*, the next generated width up is used, so it still
isn't upscaled — setting `--width-medium` to `560px` makes those pictures load
the 700px file. For a file at exactly that width, add it to `WIDTHS` in
`tools/generate-sizes.py` and re-run that script.

### Editing the CV

`content/cv.json` holds it. Each section is either a list of `entries` or a
single paragraph of `text`. Adding an exhibition is one entry:

```json
{"year": "2026", "title": "Näyttelyn nimi / Exhibition Title", "detail": "Gallery, Town"}
```

- `year` — printed once above all the entries that share it. Optional.
- `title` — set in italics. Optional; leave it out for a venue-only entry.
- `detail` — the venue, or the whole line when there is no title.
- `link` — optional; makes the title a link to somewhere else on the site.

No HTML goes in there: the italics, year headings and spacing all come from
`css/style.css`. **Writing an `<a>` tag into a title does not work** — the text
is escaped, so the tag would appear on the page as literal characters. Use
`link` instead:

```json
{
 "year": "2022",
 "title": "Mustan tahran arvoitus",
 "detail": "ISBN 978-952-230-769-9 (children's novel)",
 "link": "/books/#2022-mustan-tahran-arvoitus-isbn-978-952-230-769-9"
}
```

The four books in the CV already link to their pictures on the Books page. The
part after `#` is the picture's id, which comes from its filename — so renaming
a file breaks the link. `python3 tools/check-resolution.py` reports any that
have gone stale.

### Adding a new artwork

Adding a picture is the one job that still needs a script, because the resized
image files have to actually be made:

```sh
# 1. Put the full-size photo here
cp ~/photos/2026-uusi-teos.jpg images/original/

# 2. Add it to content/gallery.json — that's all it needs:
#      {"file": "2026-uusi-teos.jpg",
#       "size": "large",
#       "caption": ["2026 Uusi teos (New Work) 50 x 40"]}

# 3. Bring everything into step
sh tools/update.sh
```

Those three fields are genuinely all a gallery entry needs. For a **new year**,
add a group at the top of the file: `{"year": "2026", "items": [ … ]}` — the year
list on the gallery page updates itself.

Captions are a list because some run to several lines (the Books page puts title,
ISBN and genre on separate lines). One line is one list entry.

**The caption is the master.** It is both the line printed under the picture and
the `alt` text a screen reader announces, so the wording is written once and can
never drift apart. There is no `alt` field in `content/gallery.json` at all.

An `"alt"` is only needed for a picture that has **no** caption — in this site
that is the two art-book spreads in `content/books.json`, and any one-off
`<figure data-image>` written straight into a page (see below).

### Sharing a single artwork

Use the **Copy link to this work** button in the viewer. It gives an address
like:

```
https://kaijuhaanpaa.com/work/2025-kaksi-minaa-two-me-103-x-97/
```

Pasted into WhatsApp, Facebook or a message, that previews **the right
picture**. It opens a small page showing that work with its caption; clicking
the picture goes into the gallery, where the viewer opens with every work
available to arrow through.

The address bar shows the same thing, so copying from there works just as well.
Opening a picture — whether by clicking it in the gallery or arriving on a
shared link — puts that picture's address in the bar, and stepping on with the
arrow keys keeps it in step.

Why a page of its own rather than `kaijuhaanpaa.com/#2025-kaksi-minaa…`:
everything after `#` is never sent to the server, so a preview crawler asking
for such a link receives the plain gallery page and shows the same picture every
time, whichever work you meant. Links in that older form still open the right
picture — they are simply not produced any more.

The identifier comes from the filename, with accents folded to plain letters, so
it stays the same as long as the file does. **Renaming a picture's file breaks
any link already shared for it** — worth knowing before tidying filenames.

While browsing, the Back button closes the viewer rather than leaving the page,
and stepping through with the arrow keys does not fill up the browser history.

### Changing the header banner

The picture across the top of every page is a band cut from one of the collages —
currently *Päiväperho (Belle de Jour)*, 1999. To use a different one:

```sh
sh tools/make-banner.sh "images/original/<the-picture>.jpg" 1556x700+22+60
```

The second argument is the part of the master to take: `WIDTHxHEIGHT+LEFT+TOP`
in pixels. The script prints the lines to paste into `BANNER` at the top of
`js/shell.js`, and writes three sizes so phones don't download the widest file.

Three things worth knowing when choosing a crop:

- **Crop into the artwork.** The photographs include the wall behind the piece
  and the collage's own uneven edge. A band from inside the work avoids both and
  reads as a detail rather than a snapshot.
- **Take as much width as the master cleanly allows.** The banner spans the whole
  window, so a narrow crop looks soft on a large monitor.
- **Leave headroom.** The band is cropped further to fit the window, from the
  bottom mostly but the top too. `object-position` in `css/style.css` controls
  where that trimming falls; it currently sits high so faces stay clear of the
  top edge.

How tall the banner is comes from one token in `css/style.css`:

```css
--banner-height: clamp(200px, 26vw, 380px);
```

### Adding a one-off picture to any page

Write an empty figure and the right image files are worked out for you:

```html
<figure class="artwork artwork--medium"
        data-image="business-card.png"
        data-alt="Description of the picture"></figure>
```

## The tools

| Script | What it does |
| --- | --- |
| `tools/update.sh` | **The one to remember.** Runs the three below in the right order. Safe to run at any time; does nothing when nothing has changed |
| `tools/serve.sh` | Local preview at <http://localhost:8000> |
| `tools/generate-sizes.py` | Derives the 500/700/1400px copies from `images/original/`. `--force` redoes everything; `--prune` deletes copies left behind by a renamed master |
| `tools/make-work-pages.py` | Writes the share page for each artwork under `work/` |
| `tools/make-banner.sh` | Cuts the header banner out of a master. Run with no arguments for instructions |
| `tools/check-resolution.py` | Health check for the pictures: broken links, left-over files, and which masters are too small to look sharp. **Run this after renaming any image file** |
| `tools/download-originals.sh` | Re-downloads the masters listed in `tools/original-urls.txt`. Only needed if `images/original/` is lost |

### Replacing a picture with a better scan

The masters in `images/original/` are the site's archive: every size the pages
use is derived from them, so a better scan improves the site everywhere at once.

```sh
python3 tools/check-resolution.py     # which ones are worth rescanning
```

It lists the masters that are too small to look sharp, worst first. To replace
one, save the better scan over the old file **using exactly the same filename**,
then:

```sh
python3 tools/generate-sizes.py       # notices the file changed, redoes just that one
```

Nothing else needs touching — the pages read the new dimensions automatically.

## Notes on the images

The masters are the originals from the old site, untouched. Most carry an Adobe
RGB colour profile; the web copies are converted to sRGB so the colours look
right in a browser, and their metadata is stripped to save bytes.

Images are only ever scaled **down**, never up. Four of the masters are narrower
than 700px, so their larger copies stop at the master's own width — the `srcset`
reports the true widths, so the browser never picks a file that is smaller than
it claims to be.

Every picture is lazy-loaded, so opening the gallery does not pull down all 130
works at once, and every one carries its width and height so the page does not
jump about as they arrive.

## A trade-off worth knowing about

Because the pages are filled in by JavaScript, the artwork captions and CV text
are **not in the HTML source** — they appear only after the browser runs the
scripts. Google does run JavaScript and will index them, but more slowly and less
reliably than plain HTML, and some other crawlers are weaker at it.

Each page carries a static `<title>`, description and `og:` tags, so links shared
on social media preview correctly regardless.

This was a deliberate choice in favour of being easy to maintain. If search
results ever disappoint, it is reversible without a rewrite: the data files stay
as they are, and a small script could turn them back into static HTML.

## Deploying

Upload everything except `tools/` and `images/original/` — those are working
files that no page refers to. The site is `index.html`, the three page folders,
`css/`, `js/`, `content/` and the `images/500`, `images/700` and `images/1400`
folders.

`content/` **must** be uploaded — the pages read their text from it.

Any static host works: Netlify, GitHub Pages, Cloudflare Pages, or plain FTP to a
web server. Serving with gzip enabled is worth it: `gallery.json` drops from 28 KB
to about 6 KB.

### GitHub Pages

The repository can be named anything — `<username>.github.io` is only needed for
a personal landing page, and once a custom domain is attached the name stops
mattering at all.

1. **Settings → Pages**, source: deploy from the `main` branch, folder `/ (root)`.
2. Set **Custom domain** to `kaijuhaanpaa.com`. GitHub adds a `CNAME` file to the
   repository.
3. At the DNS provider, point the domain at GitHub:

   ```
   A     @    185.199.108.153
   A     @    185.199.109.153
   A     @    185.199.110.153
   A     @    185.199.111.153
   CNAME www  <username>.github.io
   ```

   (Add the four `AAAA` records from GitHub's documentation too, for IPv6.)
4. Once the certificate is issued, tick **Enforce HTTPS**.

**Expect the `github.io` address to look broken before the domain is attached.**
Every page links its stylesheet and scripts from the site root (`/css/style.css`,
`/js/site.js`), and the pages fetch their text from `/content/`. At
`username.github.io/kaijuhaanpaa.com/` those paths point one level too high, so
the pages arrive unstyled and empty. On the real domain they resolve correctly.
Nothing is wrong with the site — set the custom domain up and it comes right.

The empty `.nojekyll` file in the root tells GitHub not to run the site through
Jekyll, which it does by default. Leave it there.

`images/original/` is kept in the repository on purpose: it is the archive every
other size is made from, and doubles as an offsite backup of the masters. It is
about 130 MB, comfortably inside the 1 GB limit for a Pages site, and no page
links to it.
