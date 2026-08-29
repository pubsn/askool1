SUBJECTS = [
    "Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT",
    "Histoire-Géographie", "Philosophie", "Arabe", "Informatique",
    "Économie", "Espagnol", "Éducation religieuse", "Comptabilité",
]

LEVELS = [
    "Maternelle", "Primaire", "Collège (6e-3e)", "Lycée (2nde-Tle)",
    "Supérieur", "Adultes / Formation",
]

SERVICE_TYPES = [
    "Cours particuliers", "Enseignement en établissement",
    "Formation pour adultes", "Soutien scolaire", "Préparation aux examens",
]

REGIONS = [
    "Dakar", "Thiès", "Saint-Louis", "Diourbel", "Ziguinchor",
    "Kaolack", "Touba", "Rufisque", "Mbour", "Louga",
]

LANGUAGES = ["Français", "Anglais", "Wolof", "Arabe", "Espagnol", "Pulaar", "Sérère"]

CONTRACT_TYPES = ["CDI", "CDD", "Vacation", "Temps partiel", "Stage"]

DIPLOMAS = ["Baccalauréat", "Licence", "Master", "Doctorat", "CAP/BEP", "Certificat professionnel"]

REGION_COORDS = {
    "Dakar": [14.7167, -17.4677], "Thiès": [14.7910, -16.9256], "Saint-Louis": [16.0326, -16.4818],
    "Diourbel": [14.6559, -16.2314], "Ziguinchor": [12.5641, -16.2639], "Kaolack": [14.1652, -16.0726],
    "Touba": [14.8500, -15.8833], "Rufisque": [14.7156, -17.2736], "Mbour": [14.4198, -16.9646],
    "Louga": [15.6144, -16.2244],
}


def region_latlng(region: str, seed_id: str):
    """Deterministic lat/lng for a region + small jitter keyed on id (mirrors the frontend map)."""
    base = REGION_COORDS.get(region) or REGION_COORDS["Dakar"]
    h = 0
    for ch in (seed_id or ""):
        h = (h * 31 + ord(ch)) & 0xFFFF
    dlat = ((h % 100) - 50) / 900
    dlng = (((h >> 4) % 100) - 50) / 900
    return round(base[0] + dlat, 6), round(base[1] + dlng, 6)
