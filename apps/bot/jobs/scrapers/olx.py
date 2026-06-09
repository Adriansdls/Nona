"""OLX.pt classifieds scraper for dog listings in Algarve.

URL structure:
  https://www.olx.pt/animais/caes/?search[city]=153  (Faro district)
  https://www.olx.pt/animais/caes/?search[city]=153&page=2

Pagination: ?page=N (max 10 pages per scan = ~240 listings)

Anti-detection:
  - Playwright + stealth plugin
  - 3-8s delays between page navigations
  - Random user-agent from pool
  - Cookie persistence between scans
  - CAPTCHA detection → abort, log, notify admin
  - Optional proxy via PROXY_URL env var
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from datetime import datetime, timezone
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

OLX_BASE = "https://www.olx.pt/animais/caes/"


class OlxScraper(BaseScraper):
    source_name = "olx_pt"

    async def scrape(self, since: datetime | None = None) -> list[dict]:
        config = self.source.get("config") or {}
        regions = config.get("regions", ["faro"])
        max_pages = config.get("max_pages", 10)
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

                for region in regions:
                    region_listings = await self._scrape_region(
                        page, region, max_pages, since
                    )
                    listings.extend(region_listings)
                    await self.random_delay(2.0, 4.0)

                await browser.close()

        except ImportError:
            log.error("playwright not installed. Run: pip install playwright && playwright install chromium")
            self.update_source_status("error")
            return []
        except Exception as exc:
            log.error("OLX scraper failed", error=str(exc), exc_info=True)
            self.update_source_status("error")
            if browser:
                try:
                    await browser.close()
                except Exception:
                    pass
            return []

        self.update_source_status("ok" if listings else "no_listings")
        return listings

    async def _scrape_region(
        self,
        page: Any,
        region: str,
        max_pages: int,
        since: datetime | None,
    ) -> list[dict]:
        listings: list[dict] = []

        for page_num in range(1, max_pages + 1):
            url = f"{OLX_BASE}?search[city]={self._region_to_city_id(region)}"
            if page_num > 1:
                url += f"&page={page_num}"

            log.info("OLX: fetching page", url=url, region=region, page=page_num)

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            except Exception as exc:
                log.warning("OLX: page load failed", url=url, error=str(exc))
                break

            await asyncio.sleep(2)

            if self.detect_captcha(await page.content(), await page.title()):
                log.warning("OLX: CAPTCHA detected, aborting scan")
                self.update_source_status("blocked")
                return listings

            card_data = await self._extract_listing_cards(page)
            if not card_data:
                log.info("OLX: no listings on page, stopping", page=page_num)
                break

            for card in card_data:
                title = card.get("title", "")
                description = card.get("description", "")
                if not is_likely_dog(title, description):
                    continue

                external_id = card.get("external_id", "")
                existing = await self._check_existing(external_id)
                if existing:
                    log.debug("OLX: skipping existing listing", external_id=external_id)
                    continue

                listing = {
                    "external_id": external_id,
                    "title": title[:500],
                    "price": card.get("price", ""),
                    "location_raw": card.get("location", ""),
                    "municipality": normalize_municipality(card.get("location", "")),
                    "description": (description or "")[:2000],
                    "listing_url": card.get("url", ""),
                    "image_urls": card.get("image_urls", []),
                    "posted_at": card.get("posted_at"),
                    "is_dog": True,
                    "breed_hint": extract_breed_hint(title, description),
                    "size_hint": extract_size_hint(title, description),
                    "color_hint": extract_color_hint(title, description),
                    "scan_batch_id": self.batch_id,
                }
                listings.append(listing)

            await self.random_delay(3.0, 8.0)

        log.info("OLX: scraped region", region=region, count=len(listings))
        return listings

    async def _extract_listing_cards(self, page: Any) -> list[dict]:
        cards: list[dict] = []

        try:
            listing_links = await page.query_selector_all(
                'div[data-cy="l-card"] a, div[data-testid="l-card"] a'
            )
        except Exception:
            listing_links = []

        if not listing_links:
            try:
                listing_links = await page.query_selector_all(
                    '[data-cy="ad-card-title"], [data-testid="ad-card-title"]'
                )
            except Exception:
                return []

        for link in listing_links[:50]:
            try:
                href = await link.get_attribute("href")
                if not href:
                    continue
                url = href if href.startswith("http") else f"https://www.olx.pt{href}"

                external_id = self._extract_id_from_url(url)
                if not external_id:
                    continue

                title_el = await link.query_selector("h4, h6, [data-cy='ad-card-title'], [data-testid='ad-card-title']")
                title = (await title_el.inner_text()) if title_el else ""

                price_el = await link.query_selector("[data-cy='ad-card-price'], [data-testid='ad-card-price'], .price")
                price = (await price_el.inner_text()) if price_el else ""

                location_el = await link.query_selector("[data-cy='ad-card-location'], [data-testid='ad-card-location'], .location")
                location = (await location_el.inner_text()) if location_el else ""

                date_el = await link.query_selector("[data-cy='ad-card-date'], [data-testid='ad-card-date'], time")
                date_text = (await date_el.inner_text()) if date_el else ""

                img_els = await link.query_selector_all("img")
                image_urls = []
                for img in img_els[:3]:
                    src = await img.get_attribute("src") or await img.get_attribute("data-src")
                    if src and src.startswith("http") and "logo" not in src.lower():
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
                log.debug("OLX: failed to extract card", error=str(exc))
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
        m = re.search(r"-ID(\w+)\.html", url)
        if m:
            return m.group(1)
        m = re.search(r"/d/[\w-]+-(\w+)(?:\?|$)", url)
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
            from datetime import timedelta
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

    @staticmethod
    def _region_to_city_id(region: str) -> str:
        city_map = {
            "faro": "153",
            "portimao": "153",
            "lagos": "153",
            "albufeira": "153",
            "loule": "153",
            "olhao": "153",
            "silves": "153",
            "lagoa": "153",
            "tavira": "153",
        }
        return city_map.get(region.lower(), "153")