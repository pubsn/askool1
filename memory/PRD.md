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

## Verified
27/27 tests backend PASS, tous les flux UI OK (testing agent iteration_1).

## Backlog (P1/P2)
- P1: Upload réel de fichiers (photos/CV/diplômes) via object storage
- P1: Activation paiement Mobile Money (Orange Money/Wave) + confirmation avant premium
- P2: Split server.py en routers par domaine
- P2: Index composé unique applications(offer_id, educator_user_id)
- P2: Pièces jointes messagerie, blocage/signalement, SMS/WhatsApp notifications
- P2: Vraie carte géographique (Leaflet) pour la vue carte

## Credentials
Voir /app/memory/test_credentials.md (admin: pubsn01@gmail.com / Askool2026!)
