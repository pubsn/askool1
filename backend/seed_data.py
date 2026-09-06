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

    await enrich_schools()

    # demo parent + adult learner accounts
    for email, name, role in [("parent@askool.sn", "Amadou Diagne", "PARENT"),
                              ("apprenant@askool.sn", "Sokhna Mbaye", "ADULT_LEARNER")]:
        await db.users.insert_one({
            "user_id": _uid(), "email": email, "password_hash": pw, "name": name,
            "role": role, "roles": [role], "phone": "+221 76 000 00 00", "avatar_url": None,
            "email_verified": True, "is_premium": False, "token_version": 0,
            "created_at": now_iso(), "deleted": False,
        })


SCHOOL_ENRICH = {
    "Groupe Scolaire Les Pédagogues": {
        "slug": "groupe-scolaire-les-pedagogues", "commercial_name": "Les Pédagogues", "school_type": "Lycée",
        "status": "Privé laïc", "founded_year": 1998, "students_count": 1200, "teachers_count": 85,
        "levels": ["Préscolaire", "Primaire", "Collège", "Lycée"], "languages": ["Français", "Anglais"],
        "education_system": "Programme sénégalais", "city": "Dakar", "district": "Sacré-Cœur 3",
        "phone": "+221 33 825 00 00", "email": "contact@lespedagogues.sn", "website": "https://www.lespedagogues.sn",
        "whatsapp": "+221 77 800 00 00", "socials": {"facebook": "https://facebook.com/lespedagogues", "linkedin": "https://linkedin.com/company/lespedagogues"},
        "subjects": ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géographie", "Informatique"],
        "programs": "Programme national sénégalais renforcé, préparation BFEM et Baccalauréat, section bilingue à partir du CI.",
        "methods": "Pédagogie active, classes à effectifs réduits (25 élèves max), suivi individualisé et tutorat entre pairs.",
        "history": "Fondé en 1998 par un collectif d'enseignants, le Groupe Scolaire Les Pédagogues accueille aujourd'hui plus de 1200 élèves de la maternelle à la terminale.",
        "mission": "Former des citoyens autonomes, curieux et responsables, ancrés dans leur culture et ouverts sur le monde.",
        "values": "Excellence, bienveillance, rigueur, solidarité.",
        "pedagogy": "Approche par compétences, évaluation continue, projets interdisciplinaires et ateliers numériques.",
        "school_life": ["Club de robotique", "Journal scolaire", "Équipe de football", "Chorale", "Journées culturelles", "Olympiades de maths"],
        "infrastructures": ["45 salles de classe climatisées", "Laboratoire de sciences", "Bibliothèque", "Salle informatique (40 postes)", "Terrain de sport", "Cantine", "Infirmerie"],
        "services": ["Transport scolaire", "Restauration", "Études surveillées", "Accompagnement pédagogique", "Garderie"],
        "recruiting": ["Recrute actuellement", "Recrutement permanent", "Recrutement de vacataires"],
        "contract_types": ["CDI", "CDD", "Vacataire", "Temps plein"],
        "cover": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80",
        "logo": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=80",
        "gallery": [
            {"url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80", "caption": "Salle de classe primaire", "category": "Salles de classe"},
            {"url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80", "caption": "Laboratoire de sciences", "category": "Infrastructures"},
            {"url": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80", "caption": "Journée culturelle", "category": "Événements"},
            {"url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80", "caption": "Tournoi inter-classes", "category": "Vie scolaire"},
        ],
    },
    "Institution Sainte-Marie": {
        "slug": "institution-sainte-marie", "commercial_name": "Sainte-Marie de Thiès", "school_type": "Collège",
        "status": "Privé catholique", "founded_year": 1965, "students_count": 800, "teachers_count": 52,
        "levels": ["Primaire", "Collège", "Lycée"], "languages": ["Français"],
        "education_system": "Programme sénégalais", "city": "Thiès", "district": "Centre-ville",
        "phone": "+221 33 951 00 00", "email": "secretariat@saintemarie-thies.sn", "website": "https://www.saintemarie-thies.sn",
        "socials": {"facebook": "https://facebook.com/saintemariethies"},
        "subjects": ["Français", "Mathématiques", "Histoire-Géographie", "Anglais", "Éducation religieuse", "Philosophie"],
        "programs": "Programme national, préparation au BFEM et au Baccalauréat séries L et S.",
        "methods": "Enseignement exigeant et bienveillant, accompagnement spirituel et humain.",
        "history": "Créée en 1965 par les Sœurs de Saint-Joseph de Cluny, l'Institution est une référence de l'enseignement catholique à Thiès.",
        "mission": "Éduquer la personne dans toutes ses dimensions : intellectuelle, humaine et spirituelle.",
        "values": "Respect, travail, foi, ouverture.",
        "pedagogy": "Suivi personnalisé, études dirigées, culture de l'effort.",
        "school_life": ["Aumônerie", "Théâtre", "Basket-ball", "Club d'anglais"],
        "infrastructures": ["30 salles de classe", "Bibliothèque", "Chapelle", "Terrain de basket", "Salle polyvalente"],
        "services": ["Restauration", "Études du soir", "Accompagnement pédagogique"],
        "recruiting": ["Recrutement permanent"], "contract_types": ["CDI", "CDD"],
        "cover": "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80",
        "logo": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80",
        "gallery": [
            {"url": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900&q=80", "caption": "Cour de récréation", "category": "Vie scolaire"},
            {"url": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80", "caption": "Salle de classe", "category": "Salles de classe"},
        ],
    },
    "Cours Privé El Hadji Malick": {
        "slug": "cours-prive-el-hadji-malick", "commercial_name": "CPEHM", "school_type": "École primaire",
        "status": "Privé franco-arabe", "founded_year": 2008, "students_count": 450, "teachers_count": 30,
        "levels": ["Préscolaire", "Primaire", "Collège"], "languages": ["Français", "Arabe"],
        "education_system": "Programme franco-arabe", "city": "Dakar", "district": "Grand Dakar",
        "phone": "+221 33 864 00 00", "email": "contact@cpehm.sn", "website": "",
        "whatsapp": "+221 78 100 00 00", "socials": {"instagram": "https://instagram.com/cpehm"},
        "subjects": ["Arabe", "Français", "Mathématiques", "Éducation religieuse", "Anglais"],
        "programs": "Double cursus : programme sénégalais et enseignement de la langue arabe et du Coran.",
        "methods": "Mémorisation active, ateliers de langue, petits groupes.",
        "history": "Ouvert en 2008 à Grand Dakar pour offrir un enseignement bilingue de qualité aux familles du quartier.",
        "mission": "Réussite scolaire et épanouissement dans le respect des valeurs.",
        "values": "Discipline, respect, partage.",
        "pedagogy": "Bilinguisme équilibré français-arabe, encadrement de proximité.",
        "school_life": ["Concours de récitation", "Football", "Sorties pédagogiques"],
        "infrastructures": ["15 salles de classe", "Salle de prière", "Cour aménagée", "Salle informatique"],
        "services": ["Transport scolaire", "Cantine", "Cours du soir"],
        "recruiting": ["Recrute actuellement", "Recrutement de vacataires"], "contract_types": ["CDD", "Vacataire", "Temps partiel"],
        "cover": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80",
        "logo": "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=300&q=80",
        "gallery": [
            {"url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80", "caption": "Classe de CI", "category": "Salles de classe"},
        ],
    },
}


async def enrich_schools():
    """Idempotent: fills rich profile fields for schools that still lack a slug."""
    async for s in db.schools.find({"slug": {"$exists": False}}, {"_id": 0}):
        extra = dict(SCHOOL_ENRICH.get(s["name"], {}))
        if not extra:
            base = "".join(ch if ch.isalnum() else "-" for ch in s["name"].lower()).strip("-")
            extra["slug"] = base or s["school_id"]
        lat, lng = region_latlng(s.get("region", ""), s["user_id"])
        extra.setdefault("lat", lat); extra.setdefault("lng", lng)
        extra.setdefault("views", 120); extra.setdefault("contact_visibility", "public")
        extra.setdefault("hide_exact_location", False)
        for k in ["levels", "languages", "subjects", "school_life", "infrastructures", "services", "gallery", "recruiting", "contract_types"]:
            extra.setdefault(k, [])
        await db.schools.update_one({"school_id": s["school_id"]}, {"$set": extra})
        await db.job_offers.update_many({"school_user_id": s["user_id"]}, {"$set": {"school_slug": extra["slug"]}})


PRACTICAL = {
    "Institution Sainte-Marie": {"education_systems": ["Programme sénégalais"], "registration_fee": "25 000 FCFA", "tuition_fee": "À partir de 350 000 FCFA / an",
        "payment_terms": "Paiement en 3 tranches (octobre, janvier, avril)", "schedule": "Lundi–Vendredi 8h–13h et 15h–17h", "school_calendar": "Rentrée le 1er octobre",
        "admission_conditions": "Dossier scolaire + entretien", "min_age": 6, "required_documents": ["Extrait de naissance", "Bulletins de l'année précédente", "2 photos d'identité", "Certificat médical"],
        "registration_periods": "Mai à septembre", "available_seats": 60, "enrollment_open": True, "accept_enrollment_requests": True,
        "faq": [{"q": "Quels sont les horaires ?", "a": "8h–13h et 15h–17h du lundi au vendredi."}, {"q": "Y a-t-il une cantine ?", "a": "Oui, restauration sur place le midi."}, {"q": "Comment s'inscrire ?", "a": "Déposez un dossier au secrétariat ou envoyez une demande via ASKOOL."}]},
    "Cours Privé El Hadji Malick": {"education_systems": ["Programme franco-arabe", "Programme sénégalais"], "registration_fee": "15 000 FCFA", "tuition_fee": "À partir de 180 000 FCFA / an",
        "payment_terms": "Mensualités possibles", "schedule": "Lundi–Samedi 8h–14h", "school_calendar": "Rentrée début octobre", "admission_conditions": "Test de niveau pour le collège",
        "min_age": 3, "required_documents": ["Extrait de naissance", "Photos d'identité"], "registration_periods": "Juin à octobre", "available_seats": 40, "enrollment_open": True, "accept_enrollment_requests": True,
        "faq": [{"q": "Y a-t-il un transport scolaire ?", "a": "Oui, plusieurs circuits dans Grand Dakar et alentours."}, {"q": "Quelle est la date de rentrée ?", "a": "Début octobre chaque année."}]},
}


async def enrich_practical():
    async for s in db.schools.find({"faq": {"$exists": False}}, {"_id": 0, "school_id": 1, "name": 1}):
        extra = dict(PRACTICAL.get(s["name"], {}))
        for k, v in [("faq", []), ("education_systems", []), ("required_documents", []), ("enrollment_open", False), ("accept_enrollment_requests", False),
                     ("registration_fee", ""), ("tuition_fee", ""), ("payment_terms", ""), ("schedule", ""), ("school_calendar", ""), ("admission_conditions", ""), ("registration_periods", "")]:
            extra.setdefault(k, v)
        await db.schools.update_one({"school_id": s["school_id"]}, {"$set": extra})
