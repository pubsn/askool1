import uuid
from datetime import datetime, timezone, timedelta
from database import db
from auth import hash_password
from constants import region_latlng

now_iso = lambda: datetime.now(timezone.utc).isoformat()


def _uid():
    return f"user_{uuid.uuid4().hex[:16]}"


EDU_PHOTOS = [
    "https://images.unsplash.com/photo-1604933762021-54a5858c9832?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1744809482817-9a9d4fc280af?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1548102245-c79dbcfa9f92?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
]

EDUCATORS = [
    {"name": "Awa Ndiaye", "profession": "Professeure de Mathématiques", "region": "Dakar",
     "location": "Plateau, Dakar", "subjects": ["Mathématiques", "Physique-Chimie"],
     "levels": ["Collège (6e-3e)", "Lycée (2nde-Tle)"], "languages": ["Français", "Wolof", "Anglais"],
     "specialties": ["Préparation au BAC", "Remise à niveau"], "services": ["Cours particuliers", "Enseignement en établissement"],
     "experience_years": 8, "hourly_rate": 5000, "rating": 4.8, "reviews_count": 24, "is_verified": True,
     "bio": "Professeure passionnée avec 8 ans d'expérience. Je rends les maths accessibles à tous."},
    {"name": "Mamadou Diallo", "profession": "Professeur de Français", "region": "Dakar",
     "location": "Mermoz, Dakar", "subjects": ["Français", "Philosophie"],
     "levels": ["Lycée (2nde-Tle)", "Supérieur"], "languages": ["Français", "Anglais"],
     "specialties": ["Dissertation", "Commentaire de texte"], "services": ["Cours particuliers", "Préparation aux examens"],
     "experience_years": 12, "hourly_rate": 6000, "rating": 4.9, "reviews_count": 41, "is_verified": True,
     "bio": "Agrégé de lettres modernes. J'accompagne les élèves vers l'excellence."},
    {"name": "Fatou Sarr", "profession": "Tutrice Sciences", "region": "Thiès",
     "location": "Centre-ville, Thiès", "subjects": ["SVT", "Physique-Chimie", "Mathématiques"],
     "levels": ["Collège (6e-3e)", "Lycée (2nde-Tle)"], "languages": ["Français", "Wolof"],
     "specialties": ["Soutien scolaire"], "services": ["Cours particuliers", "Soutien scolaire"],
     "experience_years": 5, "hourly_rate": 4000, "rating": 4.6, "reviews_count": 15, "is_verified": True,
     "bio": "Étudiante en master de biologie, je propose du soutien en sciences avec pédagogie."},
    {"name": "Ibrahima Fall", "profession": "Formateur Informatique", "region": "Dakar",
     "location": "Almadies, Dakar", "subjects": ["Informatique", "Mathématiques"],
     "levels": ["Supérieur", "Adultes / Formation"], "languages": ["Français", "Anglais"],
     "specialties": ["Programmation", "Bureautique"], "services": ["Formation pour adultes", "Cours particuliers"],
     "experience_years": 7, "hourly_rate": 8000, "rating": 4.7, "reviews_count": 19, "is_verified": False,
     "bio": "Ingénieur logiciel et formateur. Cours de programmation et bureautique pour tous niveaux."},
    {"name": "Aïssatou Ba", "profession": "Professeure d'Anglais", "region": "Saint-Louis",
     "location": "Sud, Saint-Louis", "subjects": ["Anglais", "Espagnol"],
     "levels": ["Collège (6e-3e)", "Lycée (2nde-Tle)", "Adultes / Formation"], "languages": ["Français", "Anglais", "Espagnol"],
     "specialties": ["Conversation", "TOEFL"], "services": ["Cours particuliers", "Formation pour adultes"],
     "experience_years": 10, "hourly_rate": 5500, "rating": 4.9, "reviews_count": 33, "is_verified": True,
     "bio": "Bilingue, je propose des cours d'anglais dynamiques et personnalisés."},
    {"name": "Cheikh Gueye", "profession": "Professeur d'Histoire-Géographie", "region": "Dakar",
     "location": "Yoff, Dakar", "subjects": ["Histoire-Géographie", "Philosophie"],
     "levels": ["Collège (6e-3e)", "Lycée (2nde-Tle)"], "languages": ["Français", "Wolof", "Arabe"],
     "specialties": ["Méthodologie"], "services": ["Cours particuliers", "Enseignement en établissement"],
     "experience_years": 15, "hourly_rate": 5000, "rating": 4.5, "reviews_count": 12, "is_verified": True,
     "bio": "Enseignant expérimenté, je transmets le goût de l'histoire et de la géographie."},
    {"name": "Ndèye Diop", "profession": "Répétitrice Primaire", "region": "Rufisque",
     "location": "Rufisque", "subjects": ["Français", "Mathématiques"],
     "levels": ["Primaire", "Maternelle"], "languages": ["Français", "Wolof"],
     "specialties": ["Apprentissage de la lecture"], "services": ["Cours particuliers", "Soutien scolaire"],
     "experience_years": 6, "hourly_rate": 3000, "rating": 4.7, "reviews_count": 28, "is_verified": True,
     "bio": "Institutrice passionnée par l'éveil des jeunes enfants."},
    {"name": "Ousmane Sow", "profession": "Professeur de Comptabilité", "region": "Kaolack",
     "location": "Kaolack", "subjects": ["Comptabilité", "Économie"],
     "levels": ["Lycée (2nde-Tle)", "Supérieur", "Adultes / Formation"], "languages": ["Français"],
     "specialties": ["Comptabilité générale", "Gestion"], "services": ["Formation pour adultes", "Cours particuliers"],
     "experience_years": 9, "hourly_rate": 6000, "rating": 4.4, "reviews_count": 9, "is_verified": False,
     "bio": "Expert-comptable, je forme aux métiers de la gestion et de la comptabilité."},
]

SCHOOLS = [
    {"name": "Groupe Scolaire Les Pédagogues", "region": "Dakar", "location": "Sacré-Cœur, Dakar",
     "school_type": "Privé - Général", "description": "Établissement privé d'excellence de la maternelle au lycée."},
    {"name": "Institution Sainte-Marie", "region": "Thiès", "location": "Thiès",
     "school_type": "Privé - Confessionnel", "description": "Institution reconnue pour la qualité de son enseignement."},
    {"name": "Cours Privé El Hadji Malick", "region": "Dakar", "location": "Grand Dakar, Dakar",
     "school_type": "Privé - Franco-arabe", "description": "Enseignement bilingue français-arabe."},
]

JOBS = [
    {"title": "Professeur de Mathématiques (Lycée)", "subject": "Mathématiques", "level": "Lycée (2nde-Tle)",
     "contract_type": "CDI", "salary": "150 000 - 200 000 FCFA", "experience_required": 3,
     "diploma_required": "Master", "description": "Nous recherchons un professeur de mathématiques expérimenté pour nos classes de lycée.",
     "skills": ["Pédagogie", "Gestion de classe"]},
    {"title": "Enseignant Français Collège", "subject": "Français", "level": "Collège (6e-3e)",
     "contract_type": "CDD", "salary": "120 000 - 160 000 FCFA", "experience_required": 2,
     "diploma_required": "Licence", "description": "Poste à pourvoir immédiatement pour l'enseignement du français au collège.",
     "skills": ["Communication", "Rigueur"]},
    {"title": "Professeur d'Anglais", "subject": "Anglais", "level": "Lycée (2nde-Tle)",
     "contract_type": "Vacation", "salary": "80 000 - 120 000 FCFA", "experience_required": 1,
     "diploma_required": "Licence", "description": "Cours d'anglais pour les classes de seconde et première.",
     "skills": ["Bilingue", "Dynamisme"]},
    {"title": "Enseignant Primaire polyvalent", "subject": "Français", "level": "Primaire",
     "contract_type": "CDI", "salary": "100 000 - 140 000 FCFA", "experience_required": 2,
     "diploma_required": "Licence", "description": "Enseignant polyvalent pour classe de primaire.",
     "skills": ["Patience", "Créativité"]},
]

REVIEW_COMMENTS = [
    "Excellent professeur, très pédagogue et patient.",
    "Ma fille a beaucoup progressé grâce à ses cours.",
    "Ponctuel et professionnel, je recommande vivement.",
    "Méthode d'enseignement claire et efficace.",
    "Très à l'écoute et disponible.",
]


async def seed_demo_data():
    if await db.educator_profiles.count_documents({}) > 0:
        return

    pw = hash_password("Askool2026!")

    # educators
    edu_ids = []
    for i, e in enumerate(EDUCATORS):
        uid = _uid()
        edu_ids.append(uid)
        email = e["name"].lower().replace(" ", ".").replace("è", "e").replace("ï", "i").replace("é", "e") + "@askool.sn"
        await db.users.insert_one({
            "user_id": uid, "email": email, "password_hash": pw, "name": e["name"],
            "role": "EDUCATOR", "roles": ["EDUCATOR"], "phone": "+221 77 000 00 00",
            "avatar_url": EDU_PHOTOS[i % len(EDU_PHOTOS)], "email_verified": True,
            "is_premium": e["is_verified"] and i < 3, "token_version": 0,
            "created_at": now_iso(), "deleted": False,
        })
        await db.educator_profiles.insert_one({
            "profile_id": f"edu_{uuid.uuid4().hex[:16]}", "user_id": uid, "name": e["name"],
            "profession": e["profession"], "bio": e["bio"], "region": e["region"], "location": e["location"],
            "subjects": e["subjects"], "levels": e["levels"], "languages": e["languages"],
            "specialties": e["specialties"], "services": e["services"], "experience_years": e["experience_years"],
            "hourly_rate": e["hourly_rate"], "photo": EDU_PHOTOS[i % len(EDU_PHOTOS)],
            "diplomas": [{"title": "Master", "school": "UCAD", "year": 2015}],
            "experiences": [{"role": e["profession"], "place": "Établissement privé", "years": e["experience_years"]}],
            "availability": {"days": ["Lundi", "Mercredi", "Samedi"], "hours": "16h - 19h",
                             "zones": [e["region"]]},
            "available_now": True, "rating": e["rating"], "reviews_count": e["reviews_count"],
            "lat": region_latlng(e["region"], uid)[0], "lng": region_latlng(e["region"], uid)[1],
            "views": 40 + i * 13, "is_verified": e["is_verified"],
            "verification_status": "Vérifié" if e["is_verified"] else "Non vérifié",
            "active": True, "created_at": now_iso(),
        })
        # reviews
        for r in range(min(3, e["reviews_count"])):
            await db.reviews.insert_one({
                "review_id": f"rev_{uuid.uuid4().hex[:16]}", "educator_user_id": uid,
                "author_user_id": "seed", "author_name": ["Parent anonyme", "Aminata", "Moussa"][r % 3],
                "rating": e["rating"] if r == 0 else 5, "comment": REVIEW_COMMENTS[(i + r) % len(REVIEW_COMMENTS)],
                "punctuality": 5, "pedagogy": 5, "communication": 4, "verified": True,
                "booking_id": None, "created_at": now_iso(),
            })

    # schools + jobs
    school_ids = []
    for i, s in enumerate(SCHOOLS):
        uid = _uid()
        school_ids.append(uid)
        email = "contact." + s["name"].lower().split()[0] + str(i) + "@askool.sn"
        await db.users.insert_one({
            "user_id": uid, "email": email, "password_hash": pw, "name": s["name"],
            "role": "SCHOOL", "roles": ["SCHOOL"], "phone": "+221 33 000 00 00",
            "avatar_url": None, "email_verified": True, "is_premium": i == 0,
            "token_version": 0, "created_at": now_iso(), "deleted": False,
        })
        sid = f"school_{uuid.uuid4().hex[:16]}"
        await db.schools.insert_one({
            "school_id": sid, "user_id": uid, "name": s["name"], "region": s["region"],
            "location": s["location"], "description": s["description"], "school_type": s["school_type"],
            "logo": None, "verification_status": "Vérifié", "is_verified": True,
            "subscription_tier": ["Pro", "Découverte", "Premium"][i], "created_at": now_iso(),
        })
        for j, job in enumerate(JOBS):
            if (i + j) % 3 == 0 or i == 0:
                await db.job_offers.insert_one({
                    "offer_id": f"offer_{uuid.uuid4().hex[:16]}", "school_user_id": uid,
                    "school_name": s["name"], "school_id": sid, "title": job["title"],
                    "contract_type": job["contract_type"], "subject": job["subject"], "level": job["level"],
                    "region": s["region"], "location": s["location"], "salary": job["salary"],
                    "experience_required": job["experience_required"], "diploma_required": job["diploma_required"],
                    "description": job["description"], "skills": job["skills"],
                    "start_date": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
                    "deadline": (datetime.now(timezone.utc) + timedelta(days=20)).date().isoformat(),
                    "status": "published", "views": 20 + j * 7, "applications_count": 0,
                    "created_at": now_iso(), "updated_at": now_iso(),
                })

    # demo parent + adult learner accounts
    for email, name, role in [("parent@askool.sn", "Amadou Diagne", "PARENT"),
                              ("apprenant@askool.sn", "Sokhna Mbaye", "ADULT_LEARNER")]:
        await db.users.insert_one({
            "user_id": _uid(), "email": email, "password_hash": pw, "name": name,
            "role": role, "roles": [role], "phone": "+221 76 000 00 00", "avatar_url": None,
            "email_verified": True, "is_premium": False, "token_version": 0,
            "created_at": now_iso(), "deleted": False,
        })
