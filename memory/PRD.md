# PhotoPrep - PRD (Product Requirements Document)

## Problème Original
SaaS permettant de transformer automatiquement des photos brutes en photos prêtes pour plateformes de revente (Vinted, Leboncoin, Depop).

## Architecture Technique

### Stack
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Auth**: Emergent Google OAuth
- **Traitement image**: rembg (suppression de fond local)

### Structure Backend
```
/api/auth/session - Exchange session_id for session_token
/api/auth/me - Get current user info
/api/auth/logout - Logout user
/api/images/upload - Upload image
/api/images/process/{id} - Process image (background removal + enhancement)
/api/images/file/{id}/{type} - Serve image files
/api/images/history - Get user's image history
/api/images/{id} - Delete image
/api/user/profile - Get user profile with stats
/api/user/upgrade - Upgrade to premium (MOCKED)
/api/user/downgrade - Downgrade to free
```

### Collections MongoDB
- `users`: user_id, email, name, picture, credits, subscription, created_at, last_credit_reset
- `user_sessions`: user_id, session_token, expires_at, created_at
- `images`: image_id, user_id, original_path, processed_path, status, created_at, processed_at

## User Personas

### Vendeur Occasionnel
- 18-35 ans, vend quelques articles par mois sur Vinted
- Cherche à améliorer ses photos rapidement
- Plan gratuit (5 photos/mois) suffit

### Vendeur Pro
- Vend régulièrement, +20 articles/mois
- Besoin de photos cohérentes pour sa boutique
- Plan Premium (9.99€/mois illimité)

## Fonctionnalités Implémentées ✅

### MVP (Phase 1 - Complété)
- [x] Landing page avec démo avant/après interactive
- [x] Authentification Google OAuth (Emergent)
- [x] Upload d'images (drag & drop, mobile)
- [x] Suppression de fond automatique (rembg)
- [x] Fond blanc professionnel
- [x] Optimisation lumière/contraste/netteté
- [x] Aperçu avant/après avec slider
- [x] Téléchargement HD
- [x] Historique des images par utilisateur
- [x] Système de crédits (5 gratuits/mois)
- [x] Page pricing avec plans Gratuit/Premium
- [x] Profil utilisateur avec statistiques
- [x] Upgrade/Downgrade (mocked)

### Date: 28 Janvier 2025

## Backlog - Fonctionnalités Futures

### P0 (Critique pour revenus)
- [ ] Intégration Stripe pour paiements réels
- [ ] Webhooks Stripe pour gestion abonnements
- [ ] Emails transactionnels (bienvenue, rappel crédits)

### P1 (Amélioration UX)
- [ ] Traitement par lot (multiple images)
- [ ] Choix de fond (blanc, gris, transparent)
- [ ] Recadrage intelligent centré sur l'objet
- [ ] Templates de format (carré, portrait, paysage)
- [ ] PWA mobile

### P2 (Nice to have)
- [ ] Intégration IA avancée (OpenAI GPT Image 1)
- [ ] Suggestions automatiques de prix
- [ ] Export direct vers Vinted/Leboncoin API
- [ ] Analytics utilisateur détaillées
- [ ] Programme de parrainage

## Points de Vigilance

### Technique
- rembg peut prendre 30-60s au premier appel (chargement modèle)
- Stockage images à surveiller (cleanup automatique ?)
- Rate limiting à implémenter pour éviter abus

### Business
- Conversion gratuit → premium à optimiser
- Coût serveur si traitement intensif
- Concurrence (remove.bg, Canva)

## Métriques Clés
- Taux de conversion gratuit → premium
- Nombre d'images traitées / utilisateur
- Rétention mensuelle
- Temps moyen de traitement
