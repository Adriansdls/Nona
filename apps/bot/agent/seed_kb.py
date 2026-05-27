"""
Seed script for Algarve knowledge base tables.

Run once after applying migration 0011:
    uv run python -m agent.seed_kb

Phone numbers are best-effort from public sources; last_verified_at is null
to signal they need field verification before use in production agent calls.
"""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

CANILS: list[dict] = [
    {
        'municipality': 'Faro',
        'name': 'Canil Municipal de Faro',
        'phone': '289 870 600',
        'address': 'Rua da Cegonha, Faro',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
        'notes': 'Câmara Municipal de Faro — Divisão de Ambiente',
    },
    {
        'municipality': 'Lagos',
        'name': 'Canil Municipal de Lagos',
        'phone': '282 780 900',
        'address': 'Lagos',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Portimão',
        'name': 'Canil Municipal de Portimão',
        'phone': '282 400 100',
        'address': 'Portimão',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Albufeira',
        'name': 'Canil Municipal de Albufeira',
        'phone': '289 599 500',
        'address': 'Albufeira',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Loulé',
        'name': 'Canil Municipal de Loulé',
        'phone': '289 400 600',
        'address': 'Loulé',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Olhão',
        'name': 'Canil Municipal de Olhão',
        'phone': '289 700 900',
        'address': 'Olhão',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Silves',
        'name': 'Canil Municipal de Silves',
        'phone': '282 440 800',
        'address': 'Silves',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Tavira',
        'name': 'Canil Municipal de Tavira',
        'phone': '281 320 500',
        'address': 'Tavira',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Lagoa',
        'name': 'Canil Municipal de Lagoa',
        'phone': '282 380 100',
        'address': 'Lagoa',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Vila Real de Santo António',
        'name': 'Canil Municipal de VRSA',
        'phone': '281 510 800',
        'address': 'Vila Real de Santo António',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Castro Marim',
        'name': 'Canil Municipal de Castro Marim',
        'phone': '281 531 100',
        'address': 'Castro Marim',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Alcoutim',
        'name': 'GNR Alcoutim',
        'phone': '281 546 130',
        'address': 'Alcoutim',
        'source': 'seed',
        'notes': 'Sem canil dedicado — GNR coordena recolha. Confirmar protocolo com câmara.',
    },
    {
        'municipality': 'São Brás de Alportel',
        'name': 'Canil Municipal de São Brás de Alportel',
        'phone': '289 840 000',
        'address': 'São Brás de Alportel',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Aljezur',
        'name': 'Canil Municipal de Aljezur',
        'phone': '282 998 100',
        'address': 'Aljezur',
        'hours': 'Seg-Sex 9h-17h',
        'source': 'seed',
    },
    {
        'municipality': 'Vila do Bispo',
        'name': 'GNR Vila do Bispo',
        'phone': '282 630 240',
        'address': 'Vila do Bispo',
        'source': 'seed',
        'notes': 'Sem canil dedicado — GNR coordena recolha.',
    },
    {
        'municipality': 'Monchique',
        'name': 'GNR Monchique',
        'phone': '282 910 240',
        'address': 'Monchique',
        'source': 'seed',
        'notes': 'Sem canil dedicado — GNR coordena recolha.',
    },
]

VETS: list[dict] = [
    {
        'municipality': 'Faro',
        'name': 'Hospital Veterinário de Faro',
        'phone': '289 821 407',
        'address': 'Rua da República, Faro',
        'source': 'seed',
    },
    {
        'municipality': 'Faro',
        'name': 'Clínica Veterinária Faro Centro',
        'phone': '289 826 780',
        'address': 'Faro',
        'source': 'seed',
    },
    {
        'municipality': 'Lagos',
        'name': 'Clínica Veterinária de Lagos',
        'phone': '282 769 160',
        'address': 'Lagos',
        'source': 'seed',
    },
    {
        'municipality': 'Portimão',
        'name': 'Hospital Veterinário do Algarve',
        'phone': '282 419 100',
        'address': 'Portimão',
        'source': 'seed',
    },
    {
        'municipality': 'Portimão',
        'name': 'Clínica Veterinária de Portimão',
        'phone': '282 485 900',
        'address': 'Portimão',
        'source': 'seed',
    },
    {
        'municipality': 'Albufeira',
        'name': 'Clínica Veterinária de Albufeira',
        'phone': '289 542 700',
        'address': 'Albufeira',
        'source': 'seed',
    },
    {
        'municipality': 'Loulé',
        'name': 'Clínica Veterinária de Loulé',
        'phone': '289 412 970',
        'address': 'Loulé',
        'source': 'seed',
    },
    {
        'municipality': 'Olhão',
        'name': 'Clínica Veterinária de Olhão',
        'phone': '289 714 050',
        'address': 'Olhão',
        'source': 'seed',
    },
    {
        'municipality': 'Silves',
        'name': 'Clínica Veterinária de Silves',
        'phone': '282 440 990',
        'address': 'Silves',
        'source': 'seed',
    },
    {
        'municipality': 'Tavira',
        'name': 'Clínica Veterinária de Tavira',
        'phone': '281 323 004',
        'address': 'Tavira',
        'source': 'seed',
    },
    {
        'municipality': 'Lagoa',
        'name': 'Clínica Veterinária de Lagoa',
        'phone': '282 341 940',
        'address': 'Lagoa',
        'source': 'seed',
    },
    {
        'municipality': 'Vila Real de Santo António',
        'name': 'Clínica Veterinária de VRSA',
        'phone': '281 512 030',
        'address': 'Vila Real de Santo António',
        'source': 'seed',
    },
    {
        'municipality': 'São Brás de Alportel',
        'name': 'Clínica Veterinária São Brás',
        'phone': '289 843 470',
        'address': 'São Brás de Alportel',
        'source': 'seed',
    },
    {
        'municipality': 'Aljezur',
        'name': 'Clínica Veterinária do Barlavento',
        'phone': '282 998 490',
        'address': 'Aljezur',
        'source': 'seed',
    },
]

CHANNELS: list[dict] = [
    {
        'municipality': 'Algarve',
        'channel_type': 'facebook_group',
        'name': 'Cães Perdidos e Encontrados Algarve',
        'source': 'seed',
    },
    {
        'municipality': 'Algarve',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Algarve',
        'source': 'seed',
    },
    {
        'municipality': 'Algarve',
        'channel_type': 'facebook_group',
        'name': 'Galgos e Podencos Algarve SOS',
        'breed_focus': 'sighthound',
        'source': 'seed',
    },
    {
        'municipality': 'Algarve',
        'channel_type': 'facebook_group',
        'name': 'AGSAP — Associação Galgo Salvo é um Amigo Perdido',
        'breed_focus': 'sighthound',
        'source': 'seed',
    },
    {
        'municipality': 'Faro',
        'channel_type': 'facebook_group',
        'name': 'Cães Perdidos Faro e Arredores',
        'source': 'seed',
    },
    {
        'municipality': 'Lagos',
        'channel_type': 'facebook_group',
        'name': 'Cães Perdidos Lagos e Barlavento',
        'source': 'seed',
    },
    {
        'municipality': 'Portimão',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Portimão',
        'source': 'seed',
    },
    {
        'municipality': 'Albufeira',
        'channel_type': 'facebook_group',
        'name': 'Cães Perdidos Albufeira',
        'source': 'seed',
    },
    {
        'municipality': 'Loulé',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Loulé',
        'source': 'seed',
    },
    {
        'municipality': 'Olhão',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Olhão e Ria Formosa',
        'source': 'seed',
    },
    {
        'municipality': 'Tavira',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Tavira',
        'source': 'seed',
    },
    {
        'municipality': 'Silves',
        'channel_type': 'facebook_group',
        'name': 'Animais Perdidos Silves',
        'source': 'seed',
    },
    {
        'municipality': 'Algarve',
        'channel_type': 'telegram',
        'name': 'Canal SalvaCão Alertas',
        'source': 'seed',
    },
]


def main() -> None:
    url = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        print('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required', file=sys.stderr)
        sys.exit(1)

    db = create_client(url, key)

    print(f'Seeding {len(CANILS)} canils...')
    result = db.table('kb_canils').upsert(CANILS, on_conflict='name,municipality').execute()
    print(f'  → {len(result.data)} rows upserted')

    print(f'Seeding {len(VETS)} vets...')
    result = db.table('kb_vets').upsert(VETS, on_conflict='name,municipality').execute()
    print(f'  → {len(result.data)} rows upserted')

    print(f'Seeding {len(CHANNELS)} channels...')
    result = db.table('kb_channels').upsert(CHANNELS, on_conflict='name,municipality').execute()
    print(f'  → {len(result.data)} rows upserted')

    print('Done. All last_verified_at=null — field-verify phones before production use.')


if __name__ == '__main__':
    main()
