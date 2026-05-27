"""
Pydantic contracts for the search intelligence agent.

These models serve dual purpose:
1. Validate agent output (Pydantic validators enforce semantic constraints)
2. Generate tool input schemas (model_json_schema) — the contract IS the schema
"""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BreedCategory(str, Enum):
    sighthound = "sighthound"     # galgo, podenco, greyhound → 15 km
    toy = "toy"                    # chihuahua, yorkie, <5 kg → 1.2 km
    herding = "herding"            # border collie, GSD → 4 km
    gun_dog = "gun_dog"            # labrador, spaniel, retriever → 3 km
    terrier = "terrier"            # jack russell, westie → 3 km
    scent_hound = "scent_hound"    # beagle, basset → directional, up to 5 km
    large_mix = "large_mix"        # mixed ≥ 15 kg → 3 km
    small_mix = "small_mix"        # mixed < 15 kg → 2 km
    unknown = "unknown"            # unclassifiable breed


class CoordQuality(str, Enum):
    geocoded = "geocoded"                    # real address-level geocode
    centroid_fallback = "centroid_fallback"  # municipality centroid used
    unknown = "unknown"


class BehavioralPhase(str, Enum):
    panic = "panic"         # 0–24h: high mobility, fear-driven, erratic movement
    survival = "survival"   # 24h–7d: territory-seeking, den/shelter behavior
    recovery = "recovery"   # 7d+: range contracted, possible adoption


class EvidenceRef(BaseModel):
    source: str = Field(description=(
        "Citation or data source. Examples: "
        "'Albrecht/MAR 2018 IAABC', "
        "'Lord et al. 2007 JAVMA 230(2):211', "
        "'Overpass:waterway/stream 1.4km NE', "
        "'Bombeiros Lagos 2024 correiodelagos.com', "
        "'get_municipality_profile:Lagos'"
    ))
    url: str | None = Field(default=None, description="Direct URL if available")
    detail: str = Field(description="One sentence: what this source says about this specific claim")


class SearchZone(BaseModel):
    title: str = Field(description="Zone name in PT, e.g. 'Zona quente', 'Zona morna'")
    radius_km: float = Field(gt=0, description="Search radius in kilometres from last-seen point")
    color: Literal["rose", "amber", "blue"] = Field(
        description="rose=hot/urgent, amber=warm/secondary, blue=cold/extended"
    )
    instruction: str = Field(
        max_length=250,
        description="Concrete, specific action for searchers in this zone. Mention real local landmarks."
    )
    checkpoints: list[str] = Field(
        min_length=1,
        max_length=5,
        description="Specific local places to check: street names, landmarks, terrain features"
    )
    evidence: list[EvidenceRef] = Field(
        min_length=1,
        description="Sources for the radius and instruction. At least one required — no naked claims."
    )


class TerrainHazard(BaseModel):
    label: str = Field(description="Short hazard name in PT, e.g. 'Poços em quintas agrícolas'")
    note: str = Field(description="One-line context, e.g. 'zona barrocal, poços sem cobertura'")
    severity: Literal["critical", "high", "medium"]
    evidence: EvidenceRef = Field(description="Cited source for this specific hazard. Required.")


class MovementAnalysis(BaseModel):
    sightings_used: int = Field(ge=2, description="Number of sightings this analysis is based on. Minimum 2 required.")
    direction: str = Field(description="Cardinal or relative direction of travel in PT, e.g. 'nordeste', 'afastando-se da EN125'")
    speed_estimate: str | None = Field(default=None, description="Rough speed estimate if determinable from sighting gaps")
    pattern: str = Field(max_length=200, description="Movement pattern description in PT")
    evidence: list[EvidenceRef] = Field(min_length=1, description="Sightings used as evidence")


class SearchIntel(BaseModel):
    breed_category: BreedCategory
    behavioral_phase: BehavioralPhase = Field(
        description="Computed from hours_elapsed: panic=0-24h, survival=24h-7d, recovery=7d+. "
                    "Must match the hours_elapsed provided."
    )
    confidence: Literal["high", "medium", "low"] = Field(
        description=(
            "high: terrain data returned results AND breed is classified. "
            "medium: breed classified but terrain data sparse. "
            "low: significant data gaps — still useful but acknowledge uncertainty in brief."
        )
    )
    brief: str = Field(
        max_length=300,
        description="2-3 sentences PT: current situation assessment + single most urgent action right now"
    )
    brief_sources: list[EvidenceRef] = Field(
        min_length=1,
        description="Sources for the brief. Must include at least the breed study citation."
    )
    zones: list[SearchZone] = Field(min_length=1, max_length=3)
    hazards: list[TerrainHazard] = Field(
        description=(
            "Terrain hazards near the last-seen point. Empty list is valid if no hazards found. "
            "Include municipality known hazards from get_municipality_profile even if Overpass found nothing — "
            "cite the Bombeiros records. "
            "NEVER include generic hazards without evidence."
        )
    )
    movement: MovementAnalysis | None = Field(
        default=None,
        description="Movement analysis from sightings. Only include if 2+ sightings exist. "
                    "null otherwise. sightings_used ge=2 is enforced — do not populate with fewer than 2 sightings."
    )
    warnings: list[str] = Field(
        default_factory=list,
        description=(
            "Critical behavioral warnings. Include: "
            "'NÃO chamar o cão se estiver em estado de fuga/pânico — faz o cão correr mais longe' "
            "for xenophobic/sighthound breeds. "
            "Include stolen-dog warning (Lord 2007) if suspected_theft=true."
        )
    )

    @model_validator(mode="after")
    def validate_confidence_coherence(self) -> "SearchIntel":
        if self.confidence == "high" and len(self.zones) == 0:
            raise ValueError("confidence=high requires at least one zone")
        return self


class InsufficientData(BaseModel):
    reason: str = Field(description="Why reliable intel cannot be generated for this case")
    what_was_tried: list[str] = Field(
        min_length=1,
        description="Tools called and what they returned (or failed to return). Be specific."
    )
    what_was_missing: list[str] = Field(
        description="What data would be needed to generate reliable intel"
    )
    partial_context: str | None = Field(
        default=None,
        description="Any partial insight still useful — e.g. breed radius even without terrain data"
    )
    breed_category: BreedCategory | None = Field(
        default=None,
        description="Include if breed was classifiable — radius is still actionable even without terrain"
    )


class SightingPoint(BaseModel):
    lat: float
    lng: float
    zone: str
    seen_at: str  # ISO 8601
    direction: str | None = None
    description: str | None = None
    hours_ago: float


class IntelRequest(BaseModel):
    case_id: str
    slug: str
    breed: str
    size: str
    type: Literal["perdido", "encontrado"]
    suspected_theft: bool = False
    last_seen_at: str  # ISO 8601
    lat: float
    lng: float
    municipality: str
    zone_approx: str
    description: str
    sightings: list[SightingPoint] = Field(default_factory=list)
    hours_elapsed: float
    coord_quality: CoordQuality = CoordQuality.unknown
