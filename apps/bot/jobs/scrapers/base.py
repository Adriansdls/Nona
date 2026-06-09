"""Base scraper interface for classifieds listings.

Each source scraper inherits BaseScraper and implements:
  - scrape(since) -> list[dict]: fetch new listings since last scan
  - parse_listing(page) -> dict | None: extract data from a single listing page

Anti-detection strategy:
  - Playwright + stealth plugin (playwright-stealth)
  - Random delays between page navigations (3-8s)
  - Rotating user-agents (Chrome 120+ on macOS/Windows)
  - Cookie persistence via classified_sources.session_cookies
  - CAPTCHA detection: abort on challenge pages, set last_scan_status='blocked'
  - Proxy support via PROXY_URL env var (no cost by default — start without,
    add rotating residential proxy when IP bans hit)
"""
from __future__ import annotations

import asyncio
import logging
import random
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

log = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

DOG_KEYWORDS_PT = [
    "cão", "cadela", "cachorro", "filhote", "galgo", "podenco", "labrador",
    "golden", "retriever", "pastor", "beagle", "basset", "yorkshire", "york",
    "maltês", "maltes", "chihuahua", "husky", "rottweiler", "poodle", "caniche",
    "dalmata", "dálmata", "boxer", "bulldog", "pug", "shih tzu", "spaniel",
    "setter", "collie", "dobberman", "doberman", "são bernardo", "akita",
    "border collie", "wes", "west highland", "bichon", "cocker",
    "dálmata", "pinscher", "vira-lata", "vira lata", "mestiço", "mestico",
    "perdido", "encontrado", "desaparecido", "procuro",
]

SIZE_KEYWORDS = {
    "pequeno": ["pequeno", "mini", "toy", "micro", "anão"],
    "médio": ["médio", "medio", "média", "media"],
    "grande": ["grande", "gigante", "enorme"],
}

COLOR_KEYWORDS = {
    "branco": ["branco", "branca", "white"],
    "preto": ["preto", "preta", "negro", "negra", "black"],
    "castanho": ["castanho", "castanha", "marrom", "brown"],
    "bege": ["bege", "creme", "cream"],
    "cinzento": ["cinzento", "cinza", "cinzenta", "gray", "grey"],
    "ruivo": ["ruivo", "ruiva", "red", "golden"],
    "malhado": ["malhado", "malhada", "manchado", "pintado", "tricolor", "bicolor"],
    "laranja": ["laranja", "orange"],
    "fulvo": ["fulvo", "fulva", "fawn"],
}


def is_likely_dog(title: str, description: str = "") -> bool:
    text = f"{title} {description}".lower()
    return any(kw in text for kw in DOG_KEYWORDS_PT)


def extract_breed_hint(title: str, description: str = "") -> str | None:
    text = f"{title} {description}".lower()
    known_breeds = [
        "galgo", "podenco", "labrador", "golden retriever", "retriever",
        "pastor alemão", "pastor alemao", "beagle", "basset", "yorkshire",
        "maltês", "maltes", "chihuahua", "husky", "rottweiler", "poodle",
        "caniche", "dalmata", "dálmata", "boxer", "bulldog", "pug",
        "shih tzu", "spaniel", "setter", "collie", "doberman", "dobberman",
        "border collie", "cocker", "bichon", "pinscher", "akita",
        "wes", "vira-lata", "vira lata", "mestiço", "mestico",
    ]
    for breed in known_breeds:
        if breed in text:
            return breed
    return None


def extract_size_hint(title: str, description: str = "") -> str | None:
    text = f"{title} {description}".lower()
    for size, keywords in SIZE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return size
    return None


def extract_color_hint(title: str, description: str = "") -> str | None:
    text = f"{title} {description}".lower()
    for color, keywords in COLOR_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return color
    return None


def normalize_municipality(raw_location: str) -> str | None:
    mapping = {
        "faro": "Faro", "olhão": "Olhão", "olhao": "Olhão",
        "lagos": "Lagos", "portimão": "Portimão", "portimao": "Portimão",
        "albufeira": "Albufeira", "loulé": "Loulé", "loule": "Loulé",
        "silves": "Silves", "lagoa": "Lagoa", "tavira": "Tavira",
        "são brás de alportel": "São Brás de Alportel",
        "sao bras de alportel": "São Brás de Alportel",
        "vilamoura": "Loulé",
        "quarteira": "Loulé",
        "vila real de santo antónio": "Vila Real de Santo António",
        "vila real de santo antonio": "Vila Real de Santo António",
        "monchique": "Monchique", "aljezur": "Aljezur",
        "vila do bispo": "Vila do Bispo", "castro marim": "Castro Marim",
        "alcoutim": "Alcoutim",
    }
    lower = raw_location.lower().strip()
    for key, val in mapping.items():
        if key in lower:
            return val
    return None


class BaseScraper(ABC):
    source_name: str

    def __init__(self, source: dict, db: Any):
        self.source = source
        self.db = db
        self.batch_id = str(uuid.uuid4())

    @abstractmethod
    async def scrape(self, since: datetime | None = None) -> list[dict]:
        """Return list of raw listing dicts. Each dict must have:
        external_id, title, price, location_raw, municipality,
        description, listing_url, image_urls, posted_at, is_dog,
        breed_hint, size_hint, color_hint.
        """

    def detect_captcha(self, page_content: str, page_title: str = "") -> bool:
        indicators = [
            "cf-turnstile", "g-recaptcha", "Verify you are human",
            "Please verify", "Are you a robot", "challenge-platform",
            "Access denied", "blocked", "rate limit",
        ]
        content_lower = f"{page_title} {page_content}".lower()
        return any(ind.lower() in content_lower for ind in indicators)

    async def random_delay(self, min_s: float = 3.0, max_s: float = 8.0) -> None:
        await asyncio.sleep(random.uniform(min_s, max_s))

    def short_delay(self) -> float:
        return random.uniform(1.0, 2.5)

    def pick_user_agent(self) -> str:
        return random.choice(USER_AGENTS)

    def update_source_status(self, status: str) -> None:
        try:
            self.db.table("classified_sources").update({
                "last_scan_at": datetime.now(timezone.utc).isoformat(),
                "last_scan_status": status,
            }).eq("id", self.source["id"]).execute()
        except Exception as exc:
            log.error("Failed to update source status", source=self.source_name, error=str(exc))