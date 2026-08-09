#!/usr/bin/env python3
"""Harvest official logo + hero candidates for developers straight from their own websites.

Reads a pipe-delimited worklist (idx|id|name|website|logo_state|cover_state) and, for
each row, resolves the developer's official domain (given website, else candidate
domains built from the trading name), then extracts:
  - logo candidates: <img> / <link rel=icon> / og:logo whose URL or alt mentions "logo"
  - cover candidates: og:image, hero <img>/background-image with large dimensions

Every candidate is HEAD/GET-verified. Domain ownership is authenticated by requiring
the page text to contain the developer's distinctive name tokens.
Output: JSON lines to stdout.
"""
import json
import re
import sys
import urllib.parse

import requests

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/121.0 Safari/537.36")
S = requests.Session()
S.headers["User-Agent"] = UA

STOP = {"real", "estate", "development", "developments", "developer", "developers",
        "properties", "property", "llc", "l", "c", "group", "the", "fz", "dwc",
        "international", "investment", "investments", "holding", "co", "ltd", "for"}

BAD_IMG = re.compile(r"(sprite|placeholder|avatar|flag|whatsapp|instagram|facebook|"
                     r"linkedin|youtube|tiktok|arrow|icon-|spinner|loader\.gif|"
                     r"shutterstock|istock|unsplash|pexels|gettyimages|freepik|"
                     r"depositphotos|adobestock)", re.I)


def tokens(name: str):
    t = [w for w in re.split(r"[^a-z0-9&]+", name.lower()) if w and w not in STOP]
    return t


def slugs(name: str):
    t = tokens(name)
    if not t:
        return []
    joined = "".join(t)
    out = {joined, "".join(t[:2]), t[0]}
    return [s for s in out if len(s) > 3]


def candidate_domains(name: str):
    for s in slugs(name):
        for tld in (".ae", ".com", ".co", ".dubai"):
            yield "https://www." + s + tld
            yield "https://" + s + tld


def fetch(url: str, timeout=12):
    try:
        r = S.get(url, timeout=timeout, allow_redirects=True)
        if r.status_code == 200 and "text/html" in r.headers.get("content-type", ""):
            return r
    except Exception:
        return None
    return None


RE_KEYWORDS = ("real estate", "off plan", "off-plan", "residences", "apartments",
               "developer", "development", "master community", "villas", "freehold")
GEO_KEYWORDS = ("dubai", "abu dhabi", "sharjah", "uae", "united arab emirates",
                "ras al khaimah", "ajman", "emirates")


def authentic(html: str, name: str) -> bool:
    """Require the brand tokens AND real-estate AND UAE signals on the same page,
    so unrelated same-word companies (food, apparel, domain-sale parking) are rejected."""
    low = html.lower()
    t = tokens(name)
    if not t:
        return False
    brand = sum(1 for w in t if w in low)
    if brand < min(2, len(t)):
        return False
    if not any(k in low for k in RE_KEYWORDS):
        return False
    if not any(k in low for k in GEO_KEYWORDS):
        return False
    if "domain" in low and ("for sale" in low or "buy this domain" in low):
        return False
    return True


def absolutize(base: str, u: str) -> str:
    return urllib.parse.urljoin(base, u.strip().strip("'\""))


def verify_image(url: str):
    try:
        r = S.get(url, timeout=15, stream=True)
        ct = r.headers.get("content-type", "")
        if r.status_code != 200 or not ct.startswith("image"):
            return None
        data = r.raw.read(4_000_000, decode_content=True)
        if len(data) < 2000:
            return None
        return {"url": url, "content_type": ct, "bytes": len(data)}
    except Exception:
        return None


def extract(html: str, base: str):
    logos, covers = [], []
    for m in re.finditer(r'<img[^>]+>', html, re.I):
        tag = m.group(0)
        src = re.search(r'\ssrc(?:set)?=["\']([^"\']+)', tag, re.I)
        if not src:
            continue
        u = src.group(1).split(" ")[0].split(",")[0]
        if BAD_IMG.search(u):
            continue
        u = absolutize(base, u)
        blob = tag.lower()
        if "logo" in blob:
            logos.append(u)
        else:
            covers.append(u)
    for m in re.finditer(r'<meta[^>]+>', html, re.I):
        tag = m.group(0)
        if re.search(r'(og:image|twitter:image)', tag, re.I):
            c = re.search(r'content=["\']([^"\']+)', tag, re.I)
            if c and not BAD_IMG.search(c.group(1)):
                covers.insert(0, absolutize(base, c.group(1)))
    for m in re.finditer(r'background-image\s*:\s*url\((["\']?)([^)"\']+)', html, re.I):
        u = m.group(2)
        if not BAD_IMG.search(u):
            covers.append(absolutize(base, u))
    for m in re.finditer(r'<link[^>]+rel=["\'][^"\']*icon[^"\']*["\'][^>]+href=["\']([^"\']+)', html, re.I):
        logos.append(absolutize(base, m.group(1)))
    dedupe = lambda xs: list(dict.fromkeys(xs))
    return dedupe(logos)[:6], dedupe(covers)[:12]


def main() -> None:
    rows = [l.rstrip("\n").split("|") for l in open(sys.argv[1]) if l.strip()]
    for row in rows:
        idx, did, name, site, logo_state, cover_state = row[:6]
        rec = {"id": did, "name": name, "site": None, "logos": [], "covers": []}
        urls = [site] if site and site.startswith("http") and "bing.com" not in site else []
        urls += list(candidate_domains(name))
        for u in urls[:10]:
            r = fetch(u)
            if r and authentic(r.text, name):
                rec["site"] = r.url
                logos, covers = extract(r.text, r.url)
                if logo_state == "NO_LOGO":
                    for c in logos:
                        v = verify_image(c)
                        if v:
                            rec["logos"].append(v)
                        if len(rec["logos"]) >= 3:
                            break
                if cover_state == "NO_COVER" and len(covers) < 4:
                    for path in ("projects", "our-projects", "portfolio", "developments"):
                        sub = fetch(urllib.parse.urljoin(r.url, "/" + path + "/"))
                        if sub:
                            _, more = extract(sub.text, sub.url)
                            covers += more
                if cover_state == "NO_COVER":
                    for c in covers:
                        v = verify_image(c)
                        if v and v["bytes"] > 25_000:
                            rec["covers"].append(v)
                        if len(rec["covers"]) >= 4:
                            break
                break
        print(json.dumps(rec), flush=True)


if __name__ == "__main__":
    main()
