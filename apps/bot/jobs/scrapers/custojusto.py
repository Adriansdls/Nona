"""CustoJusto.pt classifieds scraper for dog listings in Algarve.

URL structure:
  https://www.custojusto.pt/faro/animais/animais-domesticos/caes
  https://www.custojusto.pt/faro/animais/animais-domesticos/caes?o=2  (page 2)

CustoJusto is more hostile to scrapers than OLX:
  - robots.txt explicitly forbids all spiders
  - Disallows pagination params (/*?o=*, /*&o=*)
  - Terms forbid automated access
  - More aggressive rate limiting and CAPTCHA

Strategy:
  - Lower RPM (8 vs 12 for OLX)
  - Longer delays (5-12s between pages)
  - Abort on any CAPTCHA or block
  - Fewer max_pages (8)
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from .base import (
    BaseScraper,
    is_likely_dog,
    extract_breed_hint,
    extract_size_hint,
    extract_color_hint,
    normalize_municipality,
)

log = logging.getLogger(__name__)

CUSTOJ_BASE = "https://www.custojusto.pt/faro/animais/animais-domesticos/caes"


class CustoJustoScraper(BaseScraper):
    source_name = "custojusto_pt"

    async def scrape(self, since: datetime | None = None) -> list[dict]:
        config = self.source.get("config") or {}
        max_pages = config.get("max_pages", 8)
        proxy_url = os.environ.get("PROXY_URL")

        listings: list[dict] = []
        browser = None

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                launch_args = {
                    "headless": os.environ.get("PLAYWRIGHT_HEADLESS", "1") == "1",
                    "args": ["--disable-blink-features=AutomationControlled"],
                }
                if proxy_url:
                    launch_args["proxy"] = {"server": proxy_url}

                browser = await p.chromium.launch(**launch_args)
                context = await browser.new_context(
                    user_agent=self.pick_user_agent(),
                    viewport={"width": 1280, "height": 900},
                    locale="pt-PT",
                    timezone_id="Europe/Lisbon",
                )

                try:
                    from playwright_stealth import Stealth
                    stealth_config = Stealth()
                    page = await context.new_page()
                    await stealth_config.apply(page)
                except ImportError:
                    page = await context.new_page()

                listings = await self._scrape_pages(page, max_pages, since)
                await browser.close()

        except ImportError:
            log.error("playwright not installed. Run: pip install playwright && playwright install chromium")
            self.update_source_status("error")
            return []
        except Exception as exc:
            log.error("CustoJusto scraper failed", error=str(exc), exc_info=True)
            self.update_source_status("error")
            if browser:
                try:
                    await browser.close()
                except Exception:
                    pass
            return []

        self.update_source_status("ok" if listings else "no_listings")
        return listings

    async def _scrape_pages(
        self,
        page: Any,
        max_pages: int,
        since: datetime | None,
    ) -> list[dict]:
        listings: list[dict] = []

        for page_num in range(1, max_pages + 1):
            url = CUSTOJ_BASE if page_num == 1 else f"{CUSTOJ_BASE}?o={page_num}"

            log.info("CustoJusto: fetching page", url=url, page=page_num)

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            except Exception as exc:
                log.warning("CustoJusto: page load failed", url=url, error=str(exc))
                break

            await asyncio.sleep(3)

            content = await page.content()
            title = await page.title()
            if self.detect_captcha(content, title):
                log.warning("CustoJusto: CAPTCHA detected, aborting scan")
                self.update_source_status("blocked")
                return listings

            if "Access denied" in content or "blocked" in content.lower():
                log.warning("CustoJusto: access blocked, aborting scan")
                self.update_source_status("blocked")
                return listings

            cards = await self._extract_listing_cards(page)
            if not cards:
                log.info("CustoJusto: no listings on page, stopping", page=page_num)
                break

            for card in cards:
                t = card.get("title", "")
                d = card.get("description", "")
                if not is_likely_dog(t, d):
                    continue

                external_id = card.get("external_id", "")
                existing = await self._check_existing(external_id)
                if existing:
                    log.debug("CustoJusto: skipping existing listing", external_id=external_id)
                    continue

                listing = {
                    "external_id": external_id,
                    "title": t[:500],
                    "price": card.get("price", ""),
                    "location_raw": card.get("location", ""),
                    "municipality": normalize_municipality(card.get("location", "")),
                    "description": (d or "")[:2000],
                    "listing_url": card.get("url", ""),
                    "image_urls": card.get("image_urls", []),
                    "posted_at": card.get("posted_at"),
                    "is_dog": True,
                    "breed_hint": extract_breed_hint(t, d),
                    "size_hint": extract_size_hint(t, d),
                    "color_hint": extract_color_hint(t, d),
                    "scan_batch_id": self.batch_id,
                }
                listings.append(listing)

            await self.random_delay(5.0, 12.0)

        log.info("CustoJusto: scraped", count=len(listings))
        return listings

    async def _extract_listing_cards(self, page: Any) -> list[dict]:
        cards: list[dict] = []

        try:
            listing_links = await page.query_selector_all(
                'div.list-item a, div[class*="ad"] a, article a[href*="/anuncio/"]'
            )
        except Exception:
            return []

        for link in listing_links[:40]:
            try:
                href = await link.get_attribute("href")
                if not href:
                    continue
                url = href if href.startswith("http") else f"https://www.custojusto.pt{href}"

                external_id = self._extract_id_from_url(url)
                if not external_id:
                    continue

                title_el = await link.query_selector("h2, h3, .title, [class*='title']")
                title = (await title_el.inner_text()) if title_el else ""

                price_el = await link.query_selector("[class*='price'], .price")
                price = (await price_el.inner_text()) if price_el else ""

                location_el = await link.query_selector("[class*='location'], .location")
                location = (await location_el.inner_text()) if location_el else ""

                date_el = await link.query_selector("time, [class*='date'], .date")
                date_text = (await date_el.inner_text()) if date_el else ""

                img_els = await link.query_selector_all("img")
                image_urls = []
                for img in img_els[:3]:
                    src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
                    if src and src.startswith("http") and "logo" not in src.lower() and "placeholder" not in src.lower():
                        image_urls.append(src)

                cards.append({
                    "external_id": external_id,
                    "title": title.strip(),
                    "price": price.strip(),
                    "location": location.strip(),
                    "url": url,
                    "posted_at": self._parse_date(date_text.strip()),
                    "image_urls": image_urls,
                    "description": "",
                })
            except Exception as exc:
                log.debug("CustoJusto: failed to extract card", error=str(exc))
                continue

        return cards

    async def _check_existing(self, external_id: str) -> bool:
        try:
            res = (
                self.db.table("classified_listings")
                .select("id")
                .eq("source_id", self.source["id"])
                .eq("external_id", external_id)
                .limit(1)
                .execute()
            )
            return bool(res.data)
        except Exception:
            return False

    @staticmethod
    def _extract_id_from_url(url: str) -> str:
        m = re.search(r"/anuncio/[\w-]+\.(\d+)", url)
        if m:
            return m.group(1)
        m = re.search(r"/(\d{6,})(?:\?|$|/)", url)
        if m:
            return m.group(1)
        return ""

    @staticmethod
    def _parse_date(date_text: str) -> datetime | None:
        now = datetime.now(timezone.utc)
        lower = date_text.lower().strip()
        if not lower:
            return None
        if "hoje" in lower:
            return now
        if "ontem" in lower:
            return now - timedelta(days=1)
        m = re.match(r"(\d+)\s*(?:min|minuto|minutos)", lower)
        if m:
            return now - timedelta(minutes=int(m.group(1)))
        m = re.match(r"(\d+)\s*(?:h|hora|horas)", lower)
        if m:
            return now - timedelta(hours=int(m.group(1)))
        m = re.match(r"(\d+)\s*(?:dia|dias)", lower)
        if m:
            return now - timedelta(days=int(m.group(1)))
        return None