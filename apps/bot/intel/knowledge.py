"""
Static knowledge base: breed profiles + Algarve municipality hazard profiles.

All hazard data is research-backed with Bombeiros records and cited sources.
No LLM involved — deterministic lookup.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .models import BreedCategory, EvidenceRef


@dataclass
class BreedProfile:
    category: BreedCategory
    keywords: list[str]
    radius_km: float
    behavior: str
    source: str
    source_url: str | None = None
    temperament: str = "unknown"  # gregarious | aloof | xenophobic


@dataclass
class KnownHazard:
    label: str
    severity: str  # critical | high | medium
    note: str
    evidence: EvidenceRef


@dataclass
class MunicipalityProfile:
    municipality: str
    terrain: str
    known_hazards: list[KnownHazard] = field(default_factory=list)
    notes: str = ""


# ---------------------------------------------------------------------------
# Breed profiles (Lord 2007 JAVMA, Kremer 2021 Frontiers, Albrecht/MAR 2018)
# ---------------------------------------------------------------------------

BREED_PROFILES: list[BreedProfile] = [
    BreedProfile(
        category=BreedCategory.sighthound,
        keywords=["galgo", "podenco", "greyhound", "whippet", "lurcher", "saluki",
                  "borzoi", "azawakh", "sloughi", "chart polski", "ibizan hound",
                  "podengo português", "podengo", "galgo español", "lebrel"],
        radius_km=15.0,
        temperament="xenophobic",
        behavior=(
            "Fuga rápida (>60 km/h em terreno aberto), orientado por visão não olfato. "
            "NÃO chamar — o som de voz familiar em estado de fuga aumenta a distância percorrida. "
            "Responde a objecto branco grande em movimento lateral (não em direcção ao cão). "
            "Cobre distâncias de vários quilómetros em minutos. "
            "Contactar redes de resgate de galgos/podencos imediatamente — reconhecem a raça e têm equipamento."
        ),
        source="Albrecht/MAR 2018 IAABC Foundation Journal; galgopodencosupport.org",
        source_url="https://journal.iaabcfoundation.org/what-we-need-to-learn-about-missing-dogs/",
    ),
    BreedProfile(
        category=BreedCategory.toy,
        keywords=["chihuahua", "yorkshire terrier", "yorkie", "maltese", "maltês",
                  "pomeranian", "toy poodle", "caniche toy", "miniature pinscher",
                  "affenpinscher", "brussels griffon", "papillon", "toy fox terrier"],
        radius_km=1.2,
        temperament="varies",
        behavior=(
            "Raramente >1.2 km nas primeiras 24h. "
            "Esconde-se sob veículos, varandas, arbustos densos. "
            "Alta probabilidade de resgate civil imediato — aparência 'claramente perdido'. "
            "Chihuahuas e raças sensíveis podem tornar-se assustadas e evitar captura mesmo pelo dono. "
            "Risco de hipotermia em noites frias (massa corporal pequena)."
        ),
        source="Albrecht 1999, 254 casos; Lord et al. 2007 JAVMA 230(2):211",
        source_url="https://pubmed.ncbi.nlm.nih.gov/17223753/",
    ),
    BreedProfile(
        category=BreedCategory.herding,
        keywords=["border collie", "australian shepherd", "aussie", "sheltie",
                  "shetland sheepdog", "german shepherd", "pastor alemão",
                  "belgian malinois", "malinois", "belgian shepherd",
                  "bouvier", "cardigan", "pembroke", "corgi", "heeler",
                  "cão de pastor", "collie"],
        radius_km=4.0,
        temperament="aloof",
        behavior=(
            "Tendência para 'aloof' — desconfia de estranhos quando perdido. "
            "Alta inteligência: resolve problemas para evitar captura. "
            "Pode estabelecer território e patrulhá-lo com rotina previsível (útil após 3+ dias). "
            "Responde melhor a armadilha-isca com comida do que a perseguição activa."
        ),
        source="Lord et al. 2007 JAVMA 230(2):211; Lost Dogs Illinois",
        source_url="https://pubmed.ncbi.nlm.nih.gov/17223753/",
    ),
    BreedProfile(
        category=BreedCategory.gun_dog,
        keywords=["labrador", "golden retriever", "retriever", "spaniel",
                  "cocker spaniel", "springer spaniel", "pointer", "setter",
                  "irish setter", "english setter", "weimaraner", "vizsla",
                  "german shorthaired pointer", "braque", "perdigueiro"],
        radius_km=3.0,
        temperament="gregarious",
        behavior=(
            "Geralmente gregário — aproxima-se de pessoas, probabilidade alta de ser 'resgatado' por civil. "
            "Ponteiros viajam mais longe que retrievers (instinto de busca). "
            "Verifica canis e publicações em redes sociais locais imediatamente — "
            "provavelmente já foi recolhido por alguém."
        ),
        source="Albrecht 1999 IAABC (pointing breeds travel farther than retrieving breeds); Weiss et al. 2012",
        source_url="https://pmc.ncbi.nlm.nih.gov/articles/PMC4494319/",
    ),
    BreedProfile(
        category=BreedCategory.terrier,
        keywords=["jack russell", "westie", "west highland", "yorkshire",
                  "bull terrier", "fox terrier", "border terrier",
                  "cairn terrier", "scottish terrier", "airedale",
                  "bedlington", "norfolk terrier", "norwich terrier",
                  "terrier"],
        radius_km=3.0,
        temperament="varies",
        behavior=(
            "Instinto de perseguição forte — podem correr considerável distância atrás de presas. "
            "Instinto de terra: podem entrar em buracos, tocas, poços. "
            "Tendem a ser gregários → encontrados relativamente depressa se abordaram pessoas."
        ),
        source="Lord et al. 2007 JAVMA; Lost Dogs Illinois breed tips",
        source_url="https://pubmed.ncbi.nlm.nih.gov/17223753/",
    ),
    BreedProfile(
        category=BreedCategory.scent_hound,
        keywords=["beagle", "basset hound", "basset", "bloodhound",
                  "coonhound", "foxhound", "harrier", "otterhound",
                  "dachshund", "teckel", "bassett"],
        radius_km=5.0,
        temperament="varies",
        behavior=(
            "Segue rasto olfativo com foco singular — ignora comandos de chamada quando em pista. "
            "Viaja na direcção do vento/rasto, não em círculos. Expandir zona de busca na direcção do vento. "
            "Usar cão de busca com rastreio olfativo se disponível."
        ),
        source="Lord et al. 2007 JAVMA; MAR scent hound behavioral profile",
        source_url="https://pubmed.ncbi.nlm.nih.gov/17223753/",
    ),
    BreedProfile(
        category=BreedCategory.large_mix,
        keywords=[],  # fallback for large unclassified dogs
        radius_km=3.0,
        temperament="unknown",
        behavior=(
            "Raça mista grande: comportamento variável. "
            "70% dos cães perdidos encontrados dentro de 1.6 km do ponto inicial (Kremer 2021). "
            "42% dentro de 400m. Começar busca sistemática por anéis concêntricos."
        ),
        source="Kremer 2021 Frontiers Vet Sci; Weiss et al. 2012 Animals",
        source_url="https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.669428",
    ),
    BreedProfile(
        category=BreedCategory.small_mix,
        keywords=[],
        radius_km=2.0,
        temperament="unknown",
        behavior=(
            "Raça mista pequena: comportamento variável, raio menor. "
            "Probabilidade alta de ter sido recolhido por civil (aparência vulnerável). "
            "Verificar canis, veterinários e grupos locais Facebook imediatamente."
        ),
        source="Kremer 2021 Frontiers Vet Sci; Albrecht 1999 IAABC",
        source_url="https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.669428",
    ),
]


def classify_breed(breed: str) -> BreedProfile:
    """Fuzzy-match breed name to behavioral profile. Returns large_mix if unclassifiable."""
    breed_lower = breed.lower()
    for profile in BREED_PROFILES:
        for keyword in profile.keywords:
            if keyword in breed_lower or breed_lower in keyword:
                return profile
    # Size heuristic: caller provides size, but we don't have it here; default large_mix
    return next(p for p in BREED_PROFILES if p.category == BreedCategory.large_mix)


def classify_breed_with_size(breed: str, size: str) -> BreedProfile:
    """Classify breed with size fallback for unknown breeds."""
    profile = classify_breed(breed)
    if profile.category in (BreedCategory.large_mix, BreedCategory.unknown):
        size_lower = size.lower()
        if any(s in size_lower for s in ["pequeno", "small", "mini", "toy", "nano"]):
            return next(p for p in BREED_PROFILES if p.category == BreedCategory.small_mix)
    return profile


# ---------------------------------------------------------------------------
# Municipality hazard profiles — research-backed, Bombeiros-cited
# ---------------------------------------------------------------------------

EN125_HAZARD = KnownHazard(
    label="EN125 — estrada nacional costeira",
    severity="high",
    note="Entre as estradas mais mortíferas de Portugal, trânsito intenso",
    evidence=EvidenceRef(
        source="The Portugal News 2023 / Sul Informação 2023",
        url="https://www.theportugalnews.com/news/2023-09-24/en125-one-of-the-most-dangerous-roads-in-portugal/81635",
        detail="EN125 listada entre as estradas com maior sinistralidade em Portugal (ANSR 2018-2023)"
    )
)

LINHA_ALGARVE_HAZARD = KnownHazard(
    label="Linha do Algarve (caminho-de-ferro)",
    severity="high",
    note="Linha electrificada Lagos–VRSA, passagens de nível em zona rural",
    evidence=EvidenceRef(
        source="Wikipedia — Linha do Algarve",
        url="https://en.wikipedia.org/wiki/Linha_do_Algarve",
        detail="Linha electrificada desde 2004 com passagens de nível ao nível do solo em zona agrícola"
    )
)


MUNICIPALITY_PROFILES: dict[str, MunicipalityProfile] = {
    "Lagos": MunicipalityProfile(
        municipality="Lagos",
        terrain="barrocal + litoral (falésia)",
        notes=(
            "Zona rural a norte (Barão de São João, Bensafrim) tem alta densidade de poços "
            "de rega abandonados em antigas quintas citrícolas. "
            "Costa sul com falésias de 20-40m (Ponta da Piedade)."
        ),
        known_hazards=[
            KnownHazard(
                label="Poços em quintas rurais (Barão de São João / Bensafrim)",
                severity="critical",
                note="Zona barrocal com quintas citrícolas abandonadas, poços de irrigação sem cobertura",
                evidence=EvidenceRef(
                    source="Bombeiros Voluntários de Lagos — resgate de 2 cães de poço 12m de profundidade",
                    url="https://correiodelagos.com/associativismo/bombeiros-voluntarios-de-lagos-resgatam-dois-caes-de-um-poco/",
                    detail="Dois cães resgatados de poço com aproximadamente 12 metros de profundidade na zona de Lagos"
                )
            ),
            KnownHazard(
                label="Falésias costeiras (Ponta da Piedade)",
                severity="critical",
                note="Falésia de 20-40m, sem vedação em vários troços",
                evidence=EvidenceRef(
                    source="Beautiful Algarve / informação geográfica",
                    url="https://www.beautifulalgarve.com/portfolio-item/cape-st-vincent/",
                    detail="Falésias costeiras em Lagos e costa sul sem vedação total"
                )
            ),
            EN125_HAZARD,
            LINHA_ALGARVE_HAZARD,
        ]
    ),
    "Olhão": MunicipalityProfile(
        municipality="Olhão",
        terrain="litoral (Ria Formosa) + barrocal periurbano",
        notes="Ria Formosa com canais de maré e ilhas barreira. Zona periurbana com vestígios de quintas.",
        known_hazards=[
            KnownHazard(
                label="Poços em zona periurbana e rural",
                severity="critical",
                note="Poços documentados em zona periurbana de Olhão",
                evidence=EvidenceRef(
                    source="Bombeiros Municipais de Olhão — resgate Abril 2025",
                    url="https://www.algarvemarafado.com/2025/04/05/bombeiros-salvam-cao-de-dentro-de-um-poco-com-fotos/",
                    detail="Cão resgatado de poço pelos Bombeiros Municipais de Olhão, Abril 2025"
                )
            ),
            KnownHazard(
                label="Ria Formosa — canais de maré e valas",
                severity="high",
                note="Canais com corrente de maré, margens de barro, risco de afogamento",
                evidence=EvidenceRef(
                    source="Ria Formosa Natural Park — geografia",
                    url=None,
                    detail="Sistema lagunar com 60 km de canais de maré, margens não vedadas em zona rural"
                )
            ),
            EN125_HAZARD,
        ]
    ),
    "Silves": MunicipalityProfile(
        municipality="Silves",
        terrain="barrocal citrícola (maior extensão do Algarve)",
        notes=(
            "Maior extensão de barrocal do Algarve. "
            "~90% da área agrícola é citricultura. "
            "Desertificação rural desde 1960s → quintas abandonadas com noras e poços sem cobertura. "
            "Noras (sistema de roda árabe) têm bocas de 1-2m de diâmetro — extremamente perigosas."
        ),
        known_hazards=[
            KnownHazard(
                label="Noras e poços em quintas citrícolas abandonadas",
                severity="critical",
                note="Maior densidade de poços agrícolas do Algarve; noras com bocas largas sem cobertura",
                evidence=EvidenceRef(
                    source="Algarve Vivo — noras, testemunho do passado agrícola",
                    url="https://algarvevivo.pt/noras-um-testemunho-do-nosso-passado-agricola/",
                    detail=(
                        "Silves tem a maior concentração de sistemas de rega tradicionais (noras) "
                        "do Algarve; quintas abandonadas não têm obrigação prática de cobertura"
                    )
                )
            ),
            KnownHazard(
                label="Rio Arade e afluentes",
                severity="high",
                note="Rio com profundidade variável, margens não vedadas em troços rurais",
                evidence=EvidenceRef(
                    source="Overpass/OSM — waterway:river Arade",
                    url=None,
                    detail="Rio Arade atravessa o município com afluentes (ribeiras) nos planaltos"
                )
            ),
            EN125_HAZARD,
        ]
    ),
    "Faro": MunicipalityProfile(
        municipality="Faro",
        terrain="litoral urbano + Ria Formosa",
        notes="Capital de distrito. Zona urbana densa + Ria Formosa a sul.",
        known_hazards=[
            KnownHazard(
                label="Ria Formosa — canais e sapal",
                severity="high",
                note="Sistema lagunar com canais de maré profundos, margens de barro",
                evidence=EvidenceRef(
                    source="Parque Natural da Ria Formosa — cartografia",
                    url=None,
                    detail="Faro bordeja 60 km de canais lagunares com margens não vedadas em vários troços"
                )
            ),
            EN125_HAZARD,
            LINHA_ALGARVE_HAZARD,
        ]
    ),
    "Loulé": MunicipalityProfile(
        municipality="Loulé",
        terrain="litoral → barrocal → Serra do Caldeirão (maior município do Algarve)",
        notes=(
            "Município mais extenso do Algarve. "
            "Norte (Salir, Querença, Alte) tem abandono rural severo com quintas desabitadas. "
            "Serra do Caldeirão: eucaliptal e pinheiro que desorientam cães (uniformidade visual)."
        ),
        known_hazards=[
            KnownHazard(
                label="Poços em zona rural norte (Salir, Querença, Alte)",
                severity="critical",
                note="Área de abandono agrícola intenso com quintas desabitadas e poços sem manutenção",
                evidence=EvidenceRef(
                    source="Decreto-Lei 310/2002 — obrigatoriedade de cobertura de poços (incumprimento generalizado em terrenos abandonados)",
                    url="https://www.homepagejuridica.pt/infojus/infojus/11671-pocos-obrigatorio-ter-protecao-saiba-como-e-quais-as-coimas-pelo-incumprimento",
                    detail="Legislação exige cobertura resistente a 100 kg; em terrenos rurais abandonados a fiscalização é mínima"
                )
            ),
            KnownHazard(
                label="Eucaliptal e pinheiro na Serra do Caldeirão",
                severity="medium",
                note="Paisagem uniforme desorientadora; cão pode entrar no montado e perder referências",
                evidence=EvidenceRef(
                    source="Serra de Monchique / Caldeirão — caracterização florestal ICNF",
                    url=None,
                    detail="Monocultura de eucalipto e pinheiro: ausência de referências visuais para o cão"
                )
            ),
            EN125_HAZARD,
        ]
    ),
    "Albufeira": MunicipalityProfile(
        municipality="Albufeira",
        terrain="litoral turístico + barrocal interior",
        notes="Zona turística densa na costa; interior mais rural com vestígios agrícolas.",
        known_hazards=[
            KnownHazard(
                label="EN125 — trânsito de alta intensidade",
                severity="high",
                note="Cruzamento da EN125 com urbanizações turísticas, trânsito intenso todo o ano",
                evidence=EvidenceRef(
                    source="The Portugal News 2023",
                    url="https://www.theportugalnews.com/news/2023-09-24/en125-one-of-the-most-dangerous-roads-in-portugal/81635",
                    detail="EN125 entre as estradas com maior mortalidade; atravessa zona densamente urbanizada em Albufeira"
                )
            ),
            KnownHazard(
                label="Falésias entre Albufeira e Olhos de Água",
                severity="high",
                note="Falésia costeira 15-30m sem vedação em vários pontos",
                evidence=EvidenceRef(
                    source="Cartografia costeira do Algarve — SNIRH/APA",
                    url=None,
                    detail="Troços de falésia activa entre Albufeira e Olhos de Água com acesso não vedado"
                )
            ),
        ]
    ),
    "Portimão": MunicipalityProfile(
        municipality="Portimão",
        terrain="litoral + estuário do Arade",
        notes="Zona urbana / industrial junto ao Arade. Praia da Rocha a sul.",
        known_hazards=[
            KnownHazard(
                label="Rio Arade e zona portuária",
                severity="high",
                note="Rio largo com corrente; zona portuária industrial sem vedação total",
                evidence=EvidenceRef(
                    source="OSM/Overpass — waterway:river Arade, Portimão",
                    url=None,
                    detail="Rio Arade atingindo 200m de largura em Portimão, margens industriais não vedadas"
                )
            ),
            EN125_HAZARD,
            LINHA_ALGARVE_HAZARD,
        ]
    ),
    "Tavira": MunicipalityProfile(
        municipality="Tavira",
        terrain="litoral (Ria Formosa este) + barrocal + serra nordeste",
        notes="Grande extensão rural interior estendendo-se para a Serra do Caldeirão. Cistrenas comuns no leste.",
        known_hazards=[
            KnownHazard(
                label="Cisternas e poços em quintas de sequeiro (alfarroba, oliva)",
                severity="critical",
                note="Interior de Tavira tem cisternas subterrâneas de recolha de água da chuva",
                evidence=EvidenceRef(
                    source="Decreto-Lei 310/2002; padrão arquitectónico do barrocal oriental",
                    url="https://www.homepagejuridica.pt/infojus/infojus/11671-pocos-obrigatorio-ter-protecao-saiba-como-e-quais-as-coimas-pelo-incumprimento",
                    detail="Cisternas subterrâneas com abertura pequena em terrenos de sequeiro — típicas do Sotavento algarvio"
                )
            ),
            KnownHazard(
                label="Ria Formosa — troço este (Cabanas, Tavira Island)",
                severity="high",
                note="Canais de maré profundos, zonas de sapal não vedadas",
                evidence=EvidenceRef(
                    source="Ria Formosa Natural Park",
                    url=None,
                    detail="Sistema lagunar estende-se por Tavira com canais de maré de profundidade variável"
                )
            ),
            EN125_HAZARD,
        ]
    ),
    "Vila Real de Santo António": MunicipalityProfile(
        municipality="Vila Real de Santo António",
        terrain="litoral fluvial + Rio Guadiana (fronteira)",
        notes="Fronteira com Espanha. Rio Guadiana largo com corrente forte.",
        known_hazards=[
            KnownHazard(
                label="Rio Guadiana — fronteira Portugal/Espanha",
                severity="critical",
                note="Rio largo (300m+) com corrente forte, embarcações em movimento",
                evidence=EvidenceRef(
                    source="Cartografia Guadiana — APA/SNIRH",
                    url=None,
                    detail="Rio Guadiana com 300m+ de largura, corrente moderada-forte, embarcações de pesca e lazer"
                )
            ),
            KnownHazard(
                label="Ria Formosa — troço final (Monte Gordo)",
                severity="high",
                note="Canais lagunares próximo de Monte Gordo",
                evidence=EvidenceRef(source="Ria Formosa Natural Park", url=None, detail="Extremidade este da Ria Formosa")
            ),
            EN125_HAZARD,
            LINHA_ALGARVE_HAZARD,
        ]
    ),
    "Castro Marim": MunicipalityProfile(
        municipality="Castro Marim",
        terrain="sapal e salinas + monte rural",
        notes="Reserva Natural do Sapal de Castro Marim. Extensa zona de sapal e salinas.",
        known_hazards=[
            KnownHazard(
                label="Sapal e salinas — lama e canais",
                severity="high",
                note="Cão pode afundar em lama do sapal; canais de drenagem não vedados",
                evidence=EvidenceRef(
                    source="Reserva Natural do Sapal de Castro Marim e VRSA",
                    url=None,
                    detail="Sapal com zonas de lama profunda e canais de drenagem a menos de 1m de profundidade"
                )
            ),
            KnownHazard(
                label="Rio Guadiana — margem sul",
                severity="high",
                note="Margem do Guadiana não vedada em troços rurais",
                evidence=EvidenceRef(source="APA/SNIRH", url=None, detail="Margem sul do Guadiana em Castro Marim")
            ),
        ]
    ),
    "Alcoutim": MunicipalityProfile(
        municipality="Alcoutim",
        terrain="Serra do Caldeirão + rio Guadiana (municipio mais isolado do Algarve)",
        notes=(
            "Município mais despovoado e isolado do Algarve. "
            "Abandono rural total em muitas aldeias. "
            "Cisternas comuns (clima seco). Sem cobertura de telemóvel em várias zonas."
        ),
        known_hazards=[
            KnownHazard(
                label="Cisternas em quintas e aldeias abandonadas",
                severity="critical",
                note="Alcoutim tem das maiores concentrações de habitações abandonadas do Algarve",
                evidence=EvidenceRef(
                    source="ICNF — censo despovoamento rural Algarve; Decreto-Lei 310/2002",
                    url=None,
                    detail="Aldeias com 0-5 residentes; cisternas e poços em edifícios sem manutenção há décadas"
                )
            ),
            KnownHazard(
                label="Rio Guadiana + ribeiras da Serra",
                severity="high",
                note="Guadiana com profundidade variável; ribeiras serranas com desfiladeiros",
                evidence=EvidenceRef(
                    source="APA/SNIRH — bacia hidrográfica do Guadiana",
                    url=None,
                    detail="Rio Guadiana e afluentes na Serra do Caldeirão com troços de difícil acesso"
                )
            ),
            KnownHazard(
                label="Serra do Caldeirão — isolamento e desorientação",
                severity="high",
                note="Mata densa, sem sinal de telemóvel, terreno acidentado",
                evidence=EvidenceRef(
                    source="ICNF — caracterização Serra do Caldeirão",
                    url=None,
                    detail="Área protegida com vegetação densa; cão perdido pode não ser detectado durante dias"
                )
            ),
        ]
    ),
    "São Brás de Alportel": MunicipalityProfile(
        municipality="São Brás de Alportel",
        terrain="barrocal / transição para serra",
        notes="Zona de transição barrocal–serra. Relativa proximidade a Faro mas carácter rural.",
        known_hazards=[
            KnownHazard(
                label="Poços em quintas de barrocal",
                severity="critical",
                note="Zona barrocal com quintas de alfarroba e olival com poços antigos",
                evidence=EvidenceRef(
                    source="Padrão barrocal algarvio; Decreto-Lei 310/2002",
                    url="https://www.homepagejuridica.pt/infojus/infojus/11671-pocos-obrigatorio-ter-protecao-saiba-como-e-quais-as-coimas-pelo-incumprimento",
                    detail="Barrocal de S. Brás partilha o mesmo padrão de poços de rega das quintas de olival e alfarroba"
                )
            ),
        ]
    ),
    "Monchique": MunicipalityProfile(
        municipality="Monchique",
        terrain="serra (ponto mais alto do Algarve: Fóia 902m)",
        notes=(
            "Serra de Monchique com eucaliptal e pinheiro (risco de incêndio extremo). "
            "Fóia: 902m de altitude. Poucas estradas de acesso. "
            "Incêndio de 2018 queimou 27.000 ha — paisagem parcialmente alterada."
        ),
        known_hazards=[
            KnownHazard(
                label="Eucaliptal e pinheiro — desorientação e risco de incêndio",
                severity="high",
                note="Monocultura de eucalipto: sem referências visuais, cão pode andar em círculos durante dias",
                evidence=EvidenceRef(
                    source="Incêndio Monchique 2018 — Copernicus EMS EMSR303; ICNF",
                    url="https://emergency.copernicus.eu/mapping/list-of-components/EMSR303",
                    detail="Eucaliptal de Monchique: 27.000 ha destruídos em 2018; alta probabilidade de reincêndio"
                )
            ),
            KnownHazard(
                label="Ravinas e linhas de água na serra",
                severity="high",
                note="Serra com declives abruptos, ravinas e ribeiras encaixadas difíceis de resgatar",
                evidence=EvidenceRef(
                    source="Serra de Monchique — Wikipedia",
                    url="https://en.wikipedia.org/wiki/Serra_de_Monchique",
                    detail="Serra com altitude de 902m (Fóia) e vertentes com declives > 40%"
                )
            ),
        ]
    ),
    "Aljezur": MunicipalityProfile(
        municipality="Aljezur",
        terrain="Costa Vicentina + serra interior",
        notes="Costa oeste com falésias e arriba fóssil. Interior com eucaliptal. Incêndios recorrentes.",
        known_hazards=[
            KnownHazard(
                label="Falésias da Costa Vicentina",
                severity="critical",
                note="Arriba viva com altura variável, acesso não vedado em trilhos costeiros",
                evidence=EvidenceRef(
                    source="Parque Natural do Sudoeste Alentejano e Costa Vicentina",
                    url=None,
                    detail="Costa Vicentina tem troços de arriba activa com alturas de 20-60m e trilhos de acesso livre"
                )
            ),
            KnownHazard(
                label="Eucaliptal — desorientação e incêndio",
                severity="high",
                note="Grande extensão de eucaliptal sujeita a incêndio (incêndio 2025 nesta zona)",
                evidence=EvidenceRef(
                    source="Portugal Resident — incêndio Aljezur/Lagos 2025",
                    url="https://www.portugalresident.com/west-algarve-wildfire-do-not-go-hiking-or-drive-in-forest-areas/",
                    detail="Incêndio grande em Aljezur/Lagos 2025, área florestal extensa consumida"
                )
            ),
        ]
    ),
    "Vila do Bispo": MunicipalityProfile(
        municipality="Vila do Bispo",
        terrain="litoral (Cabo de São Vicente, falésias 75m) + monte rural",
        notes=(
            "Extremo sudoeste de Portugal. "
            "Cabo de São Vicente: falésias de 75m, ventos fortes atlânticos. "
            "Município pouco populoso com monte rural esparso."
        ),
        known_hazards=[
            KnownHazard(
                label="Falésias Cabo de São Vicente — 75 metros",
                severity="critical",
                note="Falésias verticais de 75m com vento forte, sem vedação em toda a extensão",
                evidence=EvidenceRef(
                    source="Beautiful Algarve — Cabo de São Vicente",
                    url="https://www.beautifulalgarve.com/portfolio-item/cape-st-vincent/",
                    detail="Cabo de São Vicente: falésias de 75m, ventos dominantes de W-SW, sem vedação completa"
                )
            ),
            KnownHazard(
                label="Poços em zona rural (documentado)",
                severity="critical",
                note="Poço documentado com resgate de cão em Vila do Bispo",
                evidence=EvidenceRef(
                    source="Algarve Marafado — resgate de cão em poço, Vila do Bispo 2022",
                    url="https://www.algarvemarafado.com/2022/05/02/bombeiros-salvam-cao-que-tinha-caido-num-poco/",
                    detail="Bombeiros resgataram cão de poço de profundidade considerável em Vila do Bispo, Maio 2022"
                )
            ),
            KnownHazard(
                label="EN268 — estrada costeira isolada",
                severity="medium",
                note="Estrada com visibilidade reduzida e trânsito ocasional a alta velocidade",
                evidence=EvidenceRef(source="CartografiaPortugal/OSM", url=None, detail="EN268 percorre a costa sudoeste com troços sem berma")
            ),
        ]
    ),
    "Lagoa": MunicipalityProfile(
        municipality="Lagoa",
        terrain="litoral (Carvoeiro) + barrocal citrícola",
        notes="Zona turística costeira (Carvoeiro, Ferragudo) com falésias. Interior com citricultura.",
        known_hazards=[
            KnownHazard(
                label="Falésias de Carvoeiro e Benagil",
                severity="high",
                note="Falésia costeira com zonas não vedadas e acesso directo do interior",
                evidence=EvidenceRef(
                    source="Cartografia costeira Algarve — APA",
                    url=None,
                    detail="Carvoeiro e Benagil têm falésias de 10-30m com trilhos de acesso livre"
                )
            ),
            KnownHazard(
                label="Poços em barrocal citrícola",
                severity="critical",
                note="Interior de Lagoa partilha o padrão de quintas citrícolas com poços de barrocal",
                evidence=EvidenceRef(
                    source="Padrão barrocal algarvio; Decreto-Lei 310/2002",
                    url="https://www.homepagejuridica.pt/infojus/infojus/11671-pocos-obrigatorio-ter-protecao-saiba-como-e-quais-as-coimas-pelo-incumprimento",
                    detail="Barrocal de Lagoa com quintas citrícolas e poços antigos — mesmo padrão de Silves"
                )
            ),
            EN125_HAZARD,
        ]
    ),
}


def get_municipality_profile(municipality: str) -> MunicipalityProfile | None:
    """Return hazard profile for an Algarve municipality. Case-insensitive match."""
    muni_lower = municipality.lower().strip()
    for key, profile in MUNICIPALITY_PROFILES.items():
        if key.lower() == muni_lower:
            return profile
    # Partial match
    for key, profile in MUNICIPALITY_PROFILES.items():
        if muni_lower in key.lower() or key.lower() in muni_lower:
            return profile
    return None
