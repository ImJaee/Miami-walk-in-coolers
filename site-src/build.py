#!/usr/bin/env python3
"""Build the Miami Walk-In Coolers static site.

Each file in site-src/pages/ holds one page's <main> content, preceded by a
JSON metadata comment:

    <!--meta {"title": "...", "description": "...", "path": "/about", "nav": "about"} -->

This script wraps every page in the shared head, header, footer and scripts and
writes the result to miami-walk-in-coolers-SITE/<name>.html. Vercel serves that
folder as-is (no build step on Vercel), so run this after editing and commit
the generated HTML:

    python3 site-src/build.py

Snippets: {{QUOTE_FORM}} inserts site-src/partials/quote-form.html.
Images: <img src="/assets/img/NAME.webp"> gets width/height filled in from the
file, plus loading="lazy" unless the tag already sets fetchpriority or loading.
"""
import json
import pathlib
import re
import struct

ROOT = pathlib.Path(__file__).resolve().parent
SITE = ROOT.parent / "miami-walk-in-coolers-SITE"
DOMAIN = "https://miamiwalkincoolers.com"
OG_IMAGE = DOMAIN + "/images/miami-walk-in-coolers.webp"

PHONE_DISPLAY = "(786) 592-1077"
PHONE_TEL = "+17865921077"
EMAIL = "miamiwalkincoolers@gmail.com"
INSTAGRAM = "https://www.instagram.com/miamiwalkincoolers/"

NAV = [
    ("walk-ins", "/walk-in-applications", "Walk-Ins"),
    ("doors", "/doors", "Doors"),
    ("refrigeration", "/refrigeration-equipment", "Refrigeration"),
    ("restaurant", "/restaurant-equipment", "Equipment"),
    ("gallery", "/gallery", "Gallery"),
    ("about", "/about", "About"),
    ("contact", "/contact", "Contact"),
]
MOBILE_EXTRA = [("faq", "/faq", "FAQ")]


def webp_size(path):
    """Return (width, height) of a WebP file without third-party libraries."""
    data = path.read_bytes()[:40]
    chunk = data[12:16]
    if chunk == b"VP8 ":
        w, h = struct.unpack("<HH", data[26:30])
        return w & 0x3FFF, h & 0x3FFF
    if chunk == b"VP8L":
        b = data[21:25]
        bits = int.from_bytes(b, "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8X":
        w = int.from_bytes(data[24:27], "little") + 1
        h = int.from_bytes(data[27:30], "little") + 1
        return w, h
    raise ValueError(f"Unrecognised WebP: {path}")


def fill_images(html):
    def fix(m):
        tag = m.group(0)
        src = re.search(r'src="(/assets/img/[^"]+\.webp)"', tag)
        if not src:
            return tag
        f = SITE / src.group(1).lstrip("/")
        if not f.exists():
            raise FileNotFoundError(f"Missing image {f}")
        if "width=" not in tag:
            w, h = webp_size(f)
            tag = tag.replace("<img ", f'<img width="{w}" height="{h}" ', 1)
        if "loading=" not in tag and "fetchpriority=" not in tag:
            tag = tag.replace("<img ", '<img loading="lazy" ', 1)
        if "decoding=" not in tag:
            tag = tag.replace("<img ", '<img decoding="async" ', 1)
        return tag
    return re.sub(r"<img\b[^>]*>", fix, html)


def head(meta):
    title = meta["title"]
    desc = meta["description"]
    url = DOMAIN + (meta["path"] if meta["path"] != "/" else "/")
    extra_css = "".join(f'\n<link rel="stylesheet" href="/assets/{c}.css">' for c in meta.get("css", []))
    schema = "".join(
        f'\n<script type="application/ld+json">\n{json.dumps(s, indent=1, ensure_ascii=False)}\n</script>'
        for s in meta.get("schema", [])
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Miami Walk-In Coolers">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{OG_IMAGE}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/images/miami-walk-in-coolers.webp">
<meta name="theme-color" content="#0c1b2a">
<!-- ===== Analytics slot: paste your GA4 ID (G-XXXXXXXXXX) and uncomment to enable =====
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/site.css">{extra_css}{schema}
</head>"""


def header(active):
    current = ' aria-current="page"'
    links = "\n".join(
        f'      <a href="{href}"{current if key == active else ""}>{label}</a>'
        for key, href, label in NAV
    )
    mobile = "\n".join(
        f'    <a href="{href}"{current if key == active else ""}>{label}</a>'
        for key, href, label in NAV + MOBILE_EXTRA
    )
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container header-row">
    <a class="brand" href="/" aria-label="Miami Walk-In Coolers home"><img src="/assets/img/logo.webp" alt="Miami Walk-In Coolers" width="341" height="140"></a>
    <nav class="nav" aria-label="Main">
{links}
    </nav>
    <a class="header-phone" href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a>
    <a class="btn btn-cta header-cta" href="/get-a-quote">Get a quote</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav"><span class="menu-label">Menu</span></button>
  </div>
  <nav class="container mobile-nav" id="mobile-nav" aria-label="Mobile" hidden>
{mobile}
    <a class="btn btn-cta" href="/get-a-quote">Get a quote <span class="arrow" aria-hidden="true">→</span></a>
  </nav>
</header>"""


def footer():
    return f"""<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="/assets/img/logo.webp" alt="Miami Walk-In Coolers" width="341" height="140" loading="lazy">
        <p>Walk-in coolers and freezers, built in Miami with U.S. materials and shipped nationwide.</p>
        <p>18730 SW 104th Ave<br>Miami, FL 33157</p>
      </div>
      <div>
        <h2>Products</h2>
        <ul>
          <li><a href="/walk-in-applications">Walk-ins</a></li>
          <li><a href="/doors">Doors &amp; hardware</a></li>
          <li><a href="/refrigeration-equipment">Refrigeration</a></li>
          <li><a href="/restaurant-equipment">Restaurant equipment</a></li>
        </ul>
      </div>
      <div>
        <h2>Company</h2>
        <ul>
          <li><a href="/about">About us</a></li>
          <li><a href="/gallery">Gallery</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/get-a-quote">Get a quote</a></li>
        </ul>
      </div>
      <div>
        <h2>Talk to the shop</h2>
        <ul>
          <li><a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li>Mon–Fri · 8am–6pm ET</li>
          <li><a href="{INSTAGRAM}" rel="noopener">Instagram @miamiwalkincoolers</a></li>
        </ul>
      </div>
      <div>
        <h2>Direct lines</h2>
        <ul class="footer-lines">
          <li><span>Shaker Chehab</span><a href="tel:+13055821667">305-582-1667</a></li>
          <li><span>Ahmed Chehab</span><a href="tel:+13052058184">305-205-8184</a></li>
          <li><span>Ian Chehab</span><a href="tel:+17867787681">786-778-7681</a></li>
          <li><span>Nathan Chehab</span><a href="tel:+17864065929">786-406-5929</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <span>© 2026 Miami Walk-In Coolers. All rights reserved.</span>
      <nav aria-label="Legal"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/accessibility">Accessibility</a></nav>
    </div>
  </div>
</footer>"""


ACTION_BAR = f"""<div class="action-bar">
  <a class="btn btn-line" href="tel:{PHONE_TEL}">Call</a>
  <a class="btn btn-cta" href="/get-a-quote">Get a quote <span class="arrow" aria-hidden="true">→</span></a>
</div>"""


def cta_band(title, text, button="Get a fast quote"):
    """Closing call-to-action used at the bottom of inner pages."""
    return f"""<section class="section closer" aria-labelledby="cta-title">
    <div class="container closer-grid">
      <div class="stack">
        <p class="eyebrow">Fast quotes</p>
        <h2 class="display" id="cta-title">{title}</h2>
      </div>
      <div class="stack">
        <p class="lede">{text}</p>
        <div class="hero-actions">
          <a class="btn btn-cta" href="/get-a-quote">{button} <span class="arrow" aria-hidden="true">→</span></a>
          <a class="call-block" href="tel:{PHONE_TEL}">
            <span class="label">Or call the shop</span>
            <strong>{PHONE_DISPLAY}</strong>
            <span class="hours">Mon–Fri · 8am–6pm ET</span>
          </a>
        </div>
      </div>
    </div>
  </section>"""


def build_page(src):
    text = src.read_text()
    m = re.match(r"\s*<!--meta\s+(\{.*?\})\s*-->\s*", text, re.S)
    if not m:
        raise ValueError(f"{src.name}: missing <!--meta {{...}} --> header")
    meta = json.loads(m.group(1))
    body = text[m.end():]
    body = body.replace("{{QUOTE_FORM}}", (ROOT / "partials" / "quote-form.html").read_text())
    body = re.sub(
        r"\{\{CTA\s+(\{.*?\})\}\}",
        lambda c: cta_band(**json.loads(c.group(1))),
        body,
        flags=re.S,
    )
    scripts = ['<script src="/assets/site.js"></script>'] + [
        f'<script src="/assets/{s}.js"></script>' for s in meta.get("js", [])
    ]
    html = "\n".join([
        head(meta),
        "<body>",
        header(meta.get("nav", "")),
        f'<main id="main">\n{body.strip()}\n</main>',
        footer(),
        ACTION_BAR if meta.get("action_bar", True) else "",
        *scripts,
        "</body>",
        "</html>",
        "",
    ])
    html = fill_images(html)
    out = SITE / src.name
    out.write_text(html)
    return out


def main():
    pages = sorted((ROOT / "pages").glob("*.html"))
    for p in pages:
        out = build_page(p)
        print(f"built {out.relative_to(SITE.parent)}")


if __name__ == "__main__":
    main()
