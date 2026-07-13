# Hosting the Miami Walk-In Cooler site

This folder **is** the website — the exact files, exact design. Host it anywhere that serves
static files and it will look identical to the originals. No WordPress, no build step.

## Final setup before launch (3 quick owner steps)

1. **Turn the forms on (required for quote/contact submissions).**
   Go to web3forms.com, enter the email that should receive submissions, and copy the free
   Access Key. In `get-a-quote.html` and `contact.html`, find `YOUR_WEB3FORMS_ACCESS_KEY`
   and replace it with that key. That's it — submissions will email the owner, with a
   built-in honeypot for spam and an on-page thank-you message.
2. **Turn on analytics (optional but in the brief).** In each page's `<head>` there's a
   commented "Analytics slot". Replace `G-XXXXXXXXXX` with your GA4 ID and uncomment it
   (or paste your Google Tag Manager snippet there instead).
3. **After deploying,** add the domain in Vercel, then in Google Search Console verify the
   site and submit `https://miamiwalkincooler.com/sitemap.xml`. SSL is automatic on Vercel.

Already included in this folder: `sitemap.xml`, `robots.txt`, `favicon.ico`, `vercel.json`
(clean URLs), WebP images, Open Graph/canonical tags, and LocalBusiness schema on the home page.


## Deploying to Vercel (your chosen host)

Vercel deploys from a Git repo or its command-line tool — it has no drag-and-drop upload
like Netlify. Two straightforward paths:

**Path A — Vercel CLI (fastest if you have Node installed)**
1. Install the CLI once: `npm i -g vercel`
2. In a terminal, `cd` into this `miami-walk-in-coolers-SITE` folder.
3. Run `vercel` and follow the prompts (log in, accept defaults — it's a static site, no
   framework, no build command). A preview URL is created.
4. Run `vercel --prod` to publish to the production URL.

**Path B — GitHub → Vercel (no terminal needed)**
1. Create a new repo at github.com and upload the contents of this folder (GitHub's web
   uploader accepts a drag-drop of all the files + the `images` folder).
2. At vercel.com → Add New → Project → import that repo.
3. Framework preset: **Other**. Leave build command empty, output directory = root. Deploy.

**Connecting your custom domain**
- In the Vercel project: **Settings → Domains → Add**, enter your domain.
- Vercel shows the exact DNS records (an `A` record and/or `CNAME`). Add those at whoever
  manages the domain's DNS. If the domain currently points at WordPress.com, you'll switch
  those records over — do it last, once the Vercel URL looks right.
- SSL is issued automatically once DNS resolves.

No `vercel.json` or config is needed — it's a plain static site and works as-is. The
internal links (`doors.html`, etc.) resolve correctly on Vercel.

---

## Other easy options

**1. Netlify Drop — fastest, free, no setup**
- Go to https://app.netlify.com/drop
- Drag this whole `miami-walk-in-coolers-SITE` folder onto the page.
- It's live in ~10 seconds on a free `*.netlify.app` address. Later you can connect
  `miamiwalkincoolers.com` under Site settings → Domain management.

**2. Cloudflare Pages — free, great performance**
- https://pages.cloudflare.com → Create project → Upload assets → drop this folder.
- Add the custom domain in the project's Custom domains tab.

**3. Your own web host (cPanel / any host with a file manager)**
- Open the host's File Manager, go to `public_html` (or the site root).
- Upload everything in this folder — the `.html` files **and** the `images` folder.
- `index.html` becomes the homepage automatically.

## Pointing miamiwalkincoolers.com at the new host
The domain currently runs on WordPress.com. To show this site at that domain, update the
domain's DNS (or nameservers) to the new host — each host above gives exact instructions
when you add the custom domain. Do this step last, after you've confirmed the site looks
right on the host's temporary address.

## One thing to know
The menu links to three pages that were never built: **About**, **Get a Quote**, and
**Accessibility** (`about.html`, `get-a-quote.html`, `accessibility.html`). Those links will
show "page not found" until those files are created. Everything else is complete.

## Editing later
Same as before — open any `.html` file in a text editor, change the words between the
`< >` tags, save, re-upload. See `How-To-Edit-Your-Site.pdf` (in the original zip) for the
full walkthrough.
