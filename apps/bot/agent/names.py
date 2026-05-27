"""
Random Portuguese investigator name pool.
One name per case, assigned at creation — never the platform name.
"""
from __future__ import annotations

import random

_NAMES = [
    "Beatriz", "Rui", "Margarida", "Tiago", "Catarina", "João", "Sofia",
    "Mário", "Inês", "Filipe", "Ana", "Pedro", "Leonor", "Diogo", "Rita",
    "Gonçalo", "Carolina", "Afonso", "Marta", "Hugo", "Francisca", "André",
    "Matilde", "Nuno", "Raquel", "Bernardo", "Vera", "Miguel", "Lara", "Tomás",
    "Teresa", "Luís", "Carlota", "Vítor", "Joana", "Ricardo", "Sónia",
    "Eduardo", "Paula", "Henrique", "Bruna", "Rodrigo", "Cláudia", "Marco",
    "Diana", "Simão", "Vanessa", "David", "Patrícia", "Carlos",
]


def assign_random_name() -> str:
    return random.choice(_NAMES)
