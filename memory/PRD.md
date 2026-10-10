# ASKOOL — PRD & Architecture

## Original Problem Statement
Plateforme Web SaaS complète (français, marché Sénégal) pour le recrutement et la mise en relation dans l'éducation. Connecte Écoles, Particuliers (Parents / Apprenants adultes) et Éducateurs (profil unique: enseignant/tuteur/formateur/candidat). Identité "Warm & Human", bleu #2a4898 + orange #F8BF0E, Poppins titres.

## Stack (adapté à l'environnement)
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion
- Backend: FastAPI + MongoDB (Motor)
- Auth: JWT email/mot de passe (httpOnly cookies + Bearer) + Google OAuth (Emergent) + reset + vérification email (Resend)
- RBAC: ADMIN, SCHOOL, EDUCATOR, PARENT, ADULT_LEARNER (UUID user_id, pas d'ObjectId exposé)

## User Choices
Auth Google + email, "tout en surface", matching par règles, emails réels via Resend, paiement Mobile Money = architecture seulement.

## Implemented (2026-08-29)
- Landing complète (hero + recherche intégrée + 3 parcours + éducateurs en vedette + CTA)
- Pages publiques: Comment ça marche, Tarifs (3 audiences), Pour les écoles, À propos, FAQ, Contact, CGU/Confidentialité/Cookies
- Recherche éducateurs: filtres avancés (matière, niveau, service, région, expérience, diplôme, tarif, note, vérifié), tri, vue liste + vue carte
- Profil éducateur riche (compétences, formation, services, disponibilité, avis, contact/réserver/favori/partager)
- Auth: connexion, inscription (sélection rôle), mot de passe oublié, reset, vérification email, Google, callback
- Dashboards par rôle (side-nav desktop + bottom-nav mobile): Éducateur, École, Parent/Apprenant, Admin
- Éducateur: profil éditable, candidatures, réservations, favoris, avis, abonnement (Premium), vérification
- École: établissement, publier offre (brouillon/publier), mes offres, candidatures (pipeline de statuts), CVthèque
- Parent/Apprenant: élèves multiples, demandes de tuteur + matching (score compatibilité), réservations
- Messagerie interne, notifications, paramètres (suppression compte, consentement)
- Admin: stats globales, utilisateurs, vérifications (approuver/rejeter → badge vérifié)
- Matching par règles (compute_match) avec score % et raisons
- Abonnements (Premium éducateur, tiers écoles, Pass Famille) — architecture Mobile Money prête (pending_payment)
- SEO: metadata, OG, robots.txt, sitemap.xml, URLs propres FR
- Données démo Sénégal: 8 éducateurs, 3 écoles, offres, 25 avis, comptes parent/apprenant

## Implemented (2026-08-29, itération 2 — features supplémentaires)
- Carte interactive Leaflet (react-leaflet v5) des éducateurs par région sur /educateurs (bascule Liste/Carte, marqueurs cliquables + popup)
- Téléversement sécurisé (stockage objets Emergent) : photos publiques (aperçu), CV/diplômes privés ; contrôle d'accès 403 sans auth / 200 propriétaire+admin ; revue admin des documents
- Messagerie enrichie : pièces jointes (privées, accès participants uniquement), blocage/déblocage de conversation, signalement d'utilisateur
- Visionneuse de documents en superposition (DocViewer) côté admin et pour les pièces jointes (image/PDF in-page, pas de nouvel onglet)
- Admin : onglet Signalements (traiter), documents de vérification ouverts en overlay

## Implemented (2026-08-29, itération 3)
- Filtre par distance : sur la vue Carte, clic sur la carte = centre de recherche + rayon (slider km), cercle orange, filtrage haversine côté backend (lat/lng par éducateur), compteur de résultats, réinitialisation de zone
- Statut en ligne : indicateur « En ligne / Vu il y a X min/h/j / Hors ligne » (heartbeat /presence/ping, seuil 120s), pastille verte dans la liste de conversations
- Accusés de lecture : « Envoyé » / « Vu » sur le dernier message envoyé (rafraîchissement auto de la conversation)

## Implemented (2026-08-29, itération 4)
- Bouton « Autour de moi » : géolocalisation GPS du navigateur qui centre la carte sur la position de l'utilisateur (vue Carte)
- Alertes de zone : un parent/apprenant définit un point + rayon (+ matière/niveau optionnels) et est notifié dès qu'un nouvel éducateur correspondant rejoint sa zone (déclenché à la création/màj de profil éducateur, dédup par éducateur). Page « Alertes de zone » dans le dashboard (créer via carte, lister, supprimer)

## Verified
- iteration_1 : 27/27 backend + flux UI OK
- iteration_2 : 14/14 uploads + carte + accès privé OK
- iteration_3 : 7/7 flux messagerie enrichie + DocViewer OK
- iteration_4 : distance filter + présence + accusés de lecture 100% OK

## Implemented (2026-06, itération 5 — Paiement Mobile Money + Rappels)
- Paiement Mobile Money (Orange Money / Wave) — passerelle MOCK (mode démo, code 4 chiffres) : `POST /api/payments/initiate`, `POST /api/payments/{id}/confirm`, `GET /api/payments/mine`
- Modal de paiement réutilisable `PaymentDialog.jsx` (choix opérateur → téléphone → confirmation par code)
- Abonnement : passage Premium après confirmation ; formule Gratuite (0 FCFA) activée sans passer par le paiement
- Réservations : bouton « Payer le cours » → statut `payment_status='payé'` + `status='Confirmé'`
- Garde-fous : refus paiement d'une réservation déjà payée (409), transition atomique pending→success (idempotence)
- Cron rappels de cours : `POST /api/cron/lesson-reminders` (auth Bearer WEBHOOK_CRON_SECRET, 401 sinon) + `/app/.emergent/crons.yml` (09h Dakar, notifie parent + éducateur la veille)
- Vérifié iteration_6 : backend 6/6 pytest + flux frontend abonnement & réservation OK

## Reverted (2026-06 — à la demande de l'utilisateur)
- Les itérations 6 (Reçus de paiement PDF/email + page « Mes paiements ») et 7 (recherche intégrée au dashboard + redirection d'onboarding) ont été ANNULÉES à la demande de l'utilisateur.
- État restauré : boutons « Trouver un éducateur/emploi » rouvrent les pages publiques `/educateurs` et `/emplois` ; après inscription → redirection directe vers `/dashboard` ; pas de reçus PDF ni de page paiements.
- CONSERVÉ : le flux de paiement Mobile Money de base (`PaymentDialog` sélection opérateur → téléphone → code 4 chiffres) pour abonnements et réservations.

## Implemented (2026-06 — Opportunités côté Éducateur)
- Nouvelle page « Opportunités » (`/dashboard/opportunites`, EDUCATOR) : onglet « Offres des écoles » (liste `/jobs`) + onglet « Demandes des parents » (nouvel endpoint `GET /api/tutoring-requests/open`, EDUCATOR only, 403 sinon)
- Chaque demande affiche matière/niveau, nom du demandeur, budget, % de compatibilité (compute_match) ; bouton « Proposer mes services » → message au parent (`POST /messages`) puis redirection Messages
- Entrée de menu « Opportunités » (barre latérale éducateur) + carte d'action sur l'accueil éducateur
- Vérifié iteration_8 : backend 4/4 pytest, flux UI complet OK

## Implemented (2026-06 — Upload photo profil École & Parent)
- Profil École (`/dashboard/etablissement`) : upload du logo (FileUpload → `logo` via PUT `/schools/me`, déjà supporté côté modèle) avec aperçu
- Profil Parent / Apprenant (Paramètres `/dashboard/parametres`) : carte « Photo de profil » + upload avatar via nouvel endpoint `PUT /api/users/me/avatar` (met à jour `users.avatar_url`, renvoyé par `/auth/me`) ; `refreshUser()` rafraîchit le contexte
- Vérifié : endpoint persiste l'avatar (curl), boutons d'upload présents sur les deux pages

## Implemented (2026-06 — Module Écoles / Offres / Profils établissements) — vérifié iteration_9 (17/17 backend + UI OK)
- Backend `schools_routes.py` : modèle école enrichi (couverture, slug, identité, effectifs, niveaux, langues, présentation/histoire/mission/valeurs/pédagogie, enseignement, vie scolaire, infrastructures, services, galerie, contacts + réseaux, `contact_visibility` public/after_contact/private, `hide_exact_location`, recrutement, contrats)
- Endpoints : `GET /schools` (recherche + filtres), `GET /schools/meta`, `GET /schools/slug/{slug}` (profil public + contact filtré + offres + écoles similaires + vues), `PUT/GET /schools/me`, `GET /schools/me/overview`, `POST /schools/{id}/follow`, `GET /schools/following/mine`, `GET /schools/favorites/mine`, `GET /schools/recommended`, `POST /proposals` (+ conversation avec contexte), `GET /proposals/mine|received`, `PUT /proposals/{id}/status`, `GET /recommendations/jobs` (score % + raisons, proches de moi)
- Candidatures : `GET /applications/preview`, `POST /applications` avec `cover_letter`, `document_file_ids`, snapshot profil, `updated_at` ; notifications corrigées ; followers notifiés à chaque nouvelle offre publiée (`new_offer`)
- Messagerie : champ `context` sur conversation (Candidature — X / Proposition de services) affiché dans Messages
- Vérification écoles : `/verifications` + admin gèrent SCHOOL → badge « Établissement vérifié »
- Confidentialité éducateur : `privacy` {contact, location, experience} appliqué dans `GET /educators/{id}`
- Frontend : `/ecoles` (FindSchools, aussi `/dashboard/ecoles`), `/ecoles/:slug` (SchoolPublicProfile : couverture, logo, carte Leaflet + itinéraire, galerie zoom/catégories, offres, proposer mes services, contacter, favoris, suivre, similaires), `SchoolProfile` en 8 onglets, `Proposals.jsx` (`/dashboard/propositions`), Applications avec timeline, JobDetail flux 2 étapes (aperçu → envoi → confirmation), FindJobs onglets Toutes/Nouvelles/Recommandées/Proches (aussi `/dashboard/emplois`), Favoris (écoles favorites / suivies / éducateurs), accueil école (vue d'ensemble) et éducateur (2 blocs), nav « Écoles »
- Seed : `enrich_schools()` idempotent enrichit les écoles démo (slug, couverture, galerie, etc.)

## Implemented (2026-06 — Actualités École)
- `POST/GET /schools/me/posts`, `DELETE /schools/me/posts/{id}`, `GET /schools/{school_id}/posts` (catégories : Actualité, Événement, Besoin de recrutement, Annonce ; image optionnelle) ; chaque publication notifie les abonnés (`school_post`, lien `/ecoles/{slug}#actualites`)
- Page école `/dashboard/actualites` (SchoolNews.jsx : formulaire + liste + suppression), entrée menu « Actualités », carte d'action sur l'accueil ; section « Actualités » sur le profil public
- Vérifié : curl (création, notification follower, 400 catégorie invalide) + screenshots

## Implemented (2026-06 — Fil d'actualités éducateur)
- `GET /api/feed?limit=` (EDUCATOR, 403 sinon) : dernières publications des écoles suivies (+ logo école)
- Composant `NewsFeed.jsx` sur l'accueil éducateur : items cliquables → profil école #actualites ; état vide avec CTA « Trouver une école » / lien Écoles suivies
- Vérifié : curl (feed éducateur OK, 403 parent) + screenshot

## Implemented (2026-06 — Module Espace Parents ↔ Écoles) — vérifié iteration_10 (17/17 backend + UI OK)
- Backend (`schools_routes.py`) : école enrichie (infos pratiques : frais, modalités, horaires, calendrier, admission, âge min, documents, périodes, places, `enrollment_open`, `accept_enrollment_requests`, `education_systems`, `faq`) ; filtres parents (`service`, `language`, `education_system`, `has_fees`, `enrollment_open`, `near_lat/near_lng/radius_km` → distance) ; `GET /schools/compare?ids=` ; `GET /schools/recommended-for-parent?student_id=` (score % + raisons) ; avis école `POST /schools/reviews` (« Avis vérifié » si conversation/demande) ; demandes d'inscription (`/enrollment-requests` create/mine/received/status) ; `PUT /users/me/profile` (ville, langue, `search_prefs`, `privacy`, `notification_prefs`) ; `GET /parent/overview` ; posts : 9 catégories, images multiples, `video_url` YouTube, `PUT` édition, `GET /schools/me/posts/stats`, vues ; `PUT /schools/{id}/follow/notify` (préférence actualités) ; `/feed` ouvert à tous les rôles ; students `PUT/DELETE` + champs (établissement actuel, objectifs, préférences, année de naissance)
- Frontend : FindSchools (vue liste/carte `SchoolMap`, « Écoles près de moi », rayon, filtres familles, sélection Comparer) ; `CompareSchools` (`/comparer`, `/dashboard/comparer`) ; profil école : Infos pratiques, FAQ, Avis + formulaire, « Demander des informations » (sujets), « Demander une inscription », toggle actualités ; `EnrollmentRequests` (`/dashboard/inscriptions` parent/école) ; `Feed` (`/dashboard/fil`) ; Settings parent = Mon profil (infos, préférences de recherche, confidentialité, notifications) + `AvatarCropUpload` (recadrage canvas, suppression) ; Students enrichi (édition/suppression) ; ParentHome (stats, recommandations par enfant, fil) ; menus parent/école réorganisés ; SchoolNews (stats, édition, vidéo, images multiples) ; onglets école « Infos pratiques » et « FAQ »
- Seed : `enrich_practical()` idempotent (Sainte-Marie, El Hadji Malick)

## Implemented (2026-06 — Réactions actualités)
- `POST /posts/{id}/like` (toggle), `GET/POST /posts/{id}/comments`, `DELETE /posts/{id}/comments/{cid}` (auteur, école ou admin) ; réponses école marquées `is_school` ; notifs `post_comment` (école) / `post_reply` (commentateurs) ; compteurs `likes_count/comments_count/liked` sur profil public, feed et posts école ; stat « Interactions » dans `/schools/me/posts/stats`
- Composant `PostReactions.jsx` utilisé sur profil public, fil d'actualités et « Mes publications » (l'école répond au nom de l'établissement)
- Vérifié : curl + screenshot

## Implemented (2026-06 — Profil apprenant)
- Backend : `learner_profile` (statut, niveau, établissement, filière, matières, objectifs, localisation) via `PUT /users/me/profile` et exposé dans `/auth/me` ; `GET /learner/overview` ; `GET /learner/recommendations` (éducateurs / écoles / formations scorés) ; `GET /support/contact` (admin = Support ASKOOL)
- Frontend : `LearnerProfile.jsx` = accueil du rôle ADULT_LEARNER (en-tête avec photo/statut/localisation, infos principales, confidentialité, « Mes activités », accès rapides dont « Trouver une formation », « Recommandé pour toi », fil d'actualités, dialog d'édition avec recadrage photo et confidentialité, bouton support) ; menu apprenant réorganisé ; `/dashboard/ecoles?type=formation` préfiltre Formation professionnelle
- Vérifié : curl + screenshots

## Implemented (2026-06 — Refonte visuelle du Design System) — vérifié iteration_11
- Tokens centralisés : `tailwind.config.js` (askool.blue #203c89, bluedark/bluehover #16295e, bluelight #eef2fc, bluepale/border #dde4f4, surface #f4f6fc, orange #ee731f, orangehover #d45f11, orangelight #fdefe3, ink #000, text #4d5670, subtle #7b849c) + ombres `shadow-card`/`shadow-card-hover` + échelles de texte (page 34px / section 17px / corps 15px / libellé 14px)
- Verrouillage palette : les échelles gray/slate/neutral/zinc/stone → gris ASKOOL ; blue/indigo/violet/purple/fuchsia/sky/cyan/teal → bleu ASKOOL ; orange/amber/yellow → orange ASKOOL. Seuls emerald/red subsistent (badges de statut, choix utilisateur)
- `index.css` : variables CSS (`--askool-*`), polices Google **Poppins** (titres/chiffres/logo) + **Inter** (textes/menus/boutons), focus-visible bleu 2px, `prefers-reduced-motion`, classes `.askool-card` / `.askool-icon-chip`, vars shadcn (primary/border/muted/background) alignées sur la palette
- Layouts : sidebar dashboard #16295e, textes blancs, item actif avec liseré + icône orange ; topbar blanche bordure bleu pâle, cloche bleue + badge orange, avatar bleu ; bottom-nav mobile ; header/footer publics alignés ; cartes blanches bordure #dde4f4
- Composants : StatCard (valeurs nulles en #7b849c), PageHeader, EmptyState, Stars, PremiumBadge, PaymentDialog, CAT_COLORS (SchoolNews), maps de statut (Applications, Bookings, EnrollmentRequests)
- Aucune modification fonctionnelle, de route ou de structure de page
- Vérifié iteration_11 : 4 rôles (49 liens de menu) + 10 pages publiques sans régression, flux « Profil Apprenant » validé e2e (édition + persistance), mobile 390px sans débordement

## Fixed (2026-06 — Nettoyage console)
- `GET /api/files/{id}` : si l'objet est absent du stockage, l'enregistrement est auto-marqué `is_deleted` → plus de requêtes 404 répétées (fichiers orphelins d'anciens tests). Vérifié : 404 au 1er chargement puis console propre après rechargement
- `SecureFile.jsx` : fallback « Document indisponible » au lieu d'un squelette de chargement infini
- `CVtheque.jsx` : avatar de secours aux couleurs ASKOOL au lieu d'un `img src=""` (warning React supprimé)

## Implemented (2026-06 — Publication programmée, Partage, Parcours d'apprentissage) — vérifié iteration_12 (12/12 pytest + E2E)
- **Publication programmée** : `school_posts.scheduled_at` + `status` (`published` / `scheduled` / `draft`) ; `POST /schools/me/posts` avec `scheduled_at` futur → `scheduled` sans notification ; `POST /schools/me/posts/{id}/publish-now` (publie + notifie), `POST /schools/me/posts/{id}/unschedule` (→ brouillon) ; `GET /schools/{id}/posts`, `GET /feed` et `parent/overview` filtrés par `PUBLISHED_Q` (les docs legacy sans `status` restent publiés) ; stat `scheduled` ; cron `POST /api/cron/publish-scheduled-posts` toutes les 5 min (`.emergent/crons.yml`) → publie les dues et notifie les abonnés
- Frontend `SchoolNews.jsx` : champ « Publier plus tard » (datetime-local), bouton qui devient « Programmer », section « À venir » visible de l'école seule (badges « Programmée le … » / « Brouillon »), actions « Publier maintenant » et « Annuler la programmation », StatCard « Programmées »
- **Partage d'une actualité** : `SharePost.jsx` (WhatsApp via wa.me + copie du lien `/ecoles/{slug}#actualites`) intégré dans `PostReactions` → présent sur le fil, le profil public d'école et « Mes publications »
- **Parcours d'apprentissage** : `GET /learner/progress` (cours terminés, heures, matières, objectifs, % de progression, prochain cours) + CRUD objectifs `POST/PUT/DELETE /learner/goals` (stockés dans `users.learner_profile.goals_list`) ; composant `LearningPath.jsx` sur le dashboard apprenant (barre de progression, 3 cartes, objectifs cochables, prochain cours)

## Implemented (2026-06 — Refonte homepage & inscription, inspiration UX alexia.fr) — vérifié iteration_13 (100 % frontend)
- **Header public refondu** (`PublicLayout.jsx`) : navigation primaire épurée (Accueil, Explorer, Comment ça marche) + panneau « Menu » desktop et drawer mobile regroupant les 9 entrées secondaires (Écoles, Éducateurs, Offres d'emploi, Cours particuliers, Formations, Actualités, Conseils, À propos, Aide/Contact) + Connexion / Créer un compte ; footer réorganisé
- **Homepage** (`Landing.jsx`) structurée RECHERCHE → CATÉGORIES → PROFILS → PARCOURS → DONNÉES RÉELLES → CONFIANCE → RESSOURCES → CTA :
  - `home/HomeSearch.jsx` : recherche universelle « Que recherchez-vous ? » (5 types : École, Éducateur, Offre d'emploi, Cours, Formation) + mot-clé/matière/niveau/localisation (via `/meta`) + 4 accès rapides ; route vers `/ecoles`, `/educateurs`, `/emplois` avec les bons paramètres (`service_type=Cours particuliers`, `type=formation`)
  - `home/ExploreSection.jsx` (5 catégories), `home/AudienceSection.jsx` (4 profils + CTA Commencer → `/inscription?role=`), `home/HowItWorksSection.jsx` (3 étapes), `home/TrustSection.jsx` (compteurs **réels** issus des totaux API + garanties qualitatives, aucun chiffre inventé), `home/ResourcesSection.jsx` (guides internes réels — aucune API blog n'existe), `home/FinalCta.jsx`
  - Blocs de données réelles : éducateurs (`/educators`), offres (`/jobs`), établissements (`/schools`) avec « Voir tout » ; ancrage `#explorer` / `#actualites`
- **Cartes enrichies** : `EducatorCard` affiche niveaux + années d'expérience ; `JobCard` affiche la date de publication
- **Inscription en assistant 3 étapes** (`auth/Register.jsx`) : « Quel est votre profil ? » → identité → mot de passe, barre de progression, « Étape X sur 3 », précédent/suivant, récapitulatif, validation ; `/inscription?role=X` démarre à l'étape 2 ; appel backend `register({name,email,password,role})` **inchangé**, Google Auth conservé
- Correctif CSS : la couleur des titres passe dans `@layer base` pour ne plus écraser les utilitaires Tailwind (textes blancs sur fonds foncés)
- Aucune modification backend / API / DB / auth / routes dans cette itération

## Implemented (2026-06 — Refonte frontend premium) — vérifié iteration_14 (100 % frontend)
- **Tokens étendus** : couleurs secondaires crème `#faf7f1`, crème profond `#f3ede2`, sable `#e7e1d6`, vert discret `#1f6f5c` (+ `#17594a` / `#e8f3ef`) dans `tailwind.config.js` et `index.css` ; `green`/`emerald` remappés sur le vert ASKOOL ; orange réservé aux actions principales
- **Hero immersif** (`Landing.jsx`) : photographie éducation (Unsplash, centralisée dans `lib/images.js`), overlays en **style inline** (les opacités Tailwind type `/92` sur couleurs custom ne se généraient pas), titre/sous-titre centrés, module de recherche central + 4 accès rapides sur verre dépoli
- **Homepage** : titres de sections centrés et réduits via `home/SectionHeading.jsx`, arrière-plans alternés (blanc / crème / surface / bleu foncé), cartes illustrées (Explorer), diagramme 3 étapes avec ligne de liaison, animations au défilement via `home/Reveal.jsx` (respecte `prefers-reduced-motion`)
- **Nouvelle page `/explorer`** (`pages/Explore.jsx`, route ajoutée dans `App.js`) : hero + recherche, 5 catégories illustrées, blocs écoles / éducateurs / offres / formations alimentés par les API existantes, CTA final
- **Page `/comment-ca-marche` refondue** : parcours commun en 3 étapes + onglets par profil (Établissement, Éducateur, Parent, Apprenant) avec 4 étapes détaillées, visuel et CTA vers `/inscription?role=`, section garanties
- **Header** : « Explorer » pointe vers `/explorer` ; panneau Menu desktop sur fond bleu foncé contrasté avec survols visibles ; drawer mobile inchangé
- Aucune modification backend / API / DB / auth / logique métier

## Backlog (P1/P2)
- P1: Upload réel de fichiers (photos/CV/diplômes) via object storage
- P1: Activation paiement Mobile Money (Orange Money/Wave) + confirmation avant premium
- P2: Split server.py en routers par domaine
- P2: Index composé unique applications(offer_id, educator_user_id)
- P2: Pièces jointes messagerie, blocage/signalement, SMS/WhatsApp notifications
- P2: Vraie carte géographique (Leaflet) pour la vue carte

## Credentials
Voir /app/memory/test_credentials.md (admin: pubsn01@gmail.com / Askool2026!)
