# FAQ AkJol — squelette

Document de travail. À itérer en collectant les vraies questions des testeurs
et des premières cohortes invitées. Une fois consolidé, peut être rendu en
page `/faq` (Next.js, MDX ou simple page React).

Sections marquées `# TODO réponse` à compléter quand le service produit la
réponse définitive (souvent ça dépend du déploiement, du modèle économique
fixé, etc.).

---

## 1. C'est quoi AkJol ?

AkJol est un **routeur d'orientation** : tu décris ton point de départ (pays,
diplôme actuel, langues, contraintes), on te montre toutes tes possibilités
d'études supérieures avec leurs conditions explicites (durée, coût, niveau de
langue exigé, faisabilité). Le service est conçu pour aider les lycéens et
étudiants à comparer **partout dans le monde**, pas juste en France.

## 2. C'est gratuit ?

Oui pour l'usage de base (création de compte, exploration, comparaison,
sauvegarde de parcours). Des fonctionnalités premium arriveront plus tard
(Decision Report, AkJol Pro, plan Famille). Détails sur la page d'accueil
quand le modèle sera officialisé.

## 3. Vous remplacez Parcoursup / Mon Master ?

Non. AkJol agrège l'information et calcule la faisabilité, mais les
**candidatures officielles restent sur les plateformes officielles**
(Parcoursup, Mon Master, UCAS, etc.). On t'aide à savoir où candidater, pas à
candidater pour toi.

## 4. À partir de quel âge je peux m'inscrire ?

**15 ans minimum**, conformément au seuil français de consentement numérique
(RGPD Art. 8). En dessous, il faut le consentement d'un parent — pour
l'instant on ne gère pas encore ce flux, donc les < 15 ans sont bloqués au
signup.

## 5. Mes données sont stockées où ?

- **Compte (email, nom, hash mot de passe)** : base PostgreSQL hébergée par
  Neon (États-Unis, transferts encadrés par les SCCs européens).
- **Passeport-éducation (pays d'origine, diplôme, langues)** : en local sur ton
  navigateur par défaut. Si tu te connectes, on synchronise sur notre BD pour
  que tu retrouves tes données sur tous tes appareils.
- **Parcours sauvegardés** : en local sur ton navigateur.
- **Plus de détails** : [politique de confidentialité](/privacy).

## 6. Je peux supprimer mon compte ?

Oui, depuis ta page `/account`. La suppression est définitive et nous effaçons
toutes tes données sous 30 jours. Si tu veux récupérer une copie de tes
données avant suppression (portabilité RGPD), écris-nous à contact@akjol.app.

## 7. Vous vendez mes données ?

**Non.** Pas de revente, pas de profilage publicitaire. AkJol utilise un
analytics sans cookies ni empreinte (Plausible) que tu peux désactiver.

## 8. D'où viennent les fiches programmes ?

Sources publiques uniquement, citées sur chaque fiche :
- ONISEP (France, formations courtes et longues)
- MESR (data.enseignementsup-recherche.gouv.fr)
- Parcoursup, Mon Master
- UCAS (UK)
- # TODO compléter avec les sources internationales au fur et à mesure

Les fiches affichées sont **curées** (vérifiées par notre équipe ou par moi)
ou marquées comme « brutes » si pas encore validées.

## 9. Qu'est-ce que le « statut de faisabilité » ?

Pour chaque programme, on calcule :
- 🟢 **Ouvert** : tu remplis tous les prérequis (diplôme, langue, budget).
- 🟡 **Ouvert avec étape** : il te manque un truc atteignable (ex : passer un
  TOEFL, avoir le bac).
- 🔴 **Fermé** : il manque un prérequis structurel (ex : diplôme inadéquat).
- ⚪ **Non couvert** : pas assez d'info pour décider.

**Important :** ce statut est indicatif. La décision finale appartient aux
écoles et plateformes officielles, pas à AkJol.

## 10. Comment vous gagnez de l'argent ?

Aujourd'hui : zéro revenu, service gratuit. À terme : modèle freemium
(features premium pour les étudiants qui veulent aller plus loin) + plan
Famille + éventuellement programmes sponsorisés **clairement séparés** des
résultats organiques. Pas de publicité comportementale, pas de vente de
données.

## 11. Qui peut éditer les fiches ?

Seuls les comptes ayant le rôle « curator » ou « admin ». Aujourd'hui, c'est
[À COMPLÉTER : toi seul]. On ouvrira progressivement à des contributeurs de
confiance avec audit log et validation croisée.

## 12. Je trouve une erreur sur une fiche, je fais quoi ?

Écris à contact@akjol.app avec :
- L'URL de la fiche concernée
- Ce qui est faux
- La source officielle qui dit le contraire (ONISEP, site école, etc.)

On corrige sous 7 jours en moyenne. Merci d'avance — chaque correction
améliore l'outil pour tous les utilisateurs.

## 13. Vous êtes une asso, une boîte, un projet perso ?

[À COMPLÉTER une fois SASU créée] — Statut SASU AkJol au capital de … €.
Siège social : … . SIREN : … . Voir [mentions légales](/mentions-legales).

## 14. Vous êtes neutres ? Genre, pas payé par une école ?

Aujourd'hui oui, totalement. Quand on lancera les programmes sponsorisés
(plus tard), ils seront **toujours visuellement et structurellement séparés**
des résultats organiques (badge « Sponsorisé », ordre indépendant du score
de faisabilité). C'est inscrit dans les CGU et dans notre charte éditoriale.

## 15. Comment vous contacter ?

- Bug technique ou contenu : contact@akjol.app
- Question RGPD / mes données : contact@akjol.app (DPO à désigner quand
  applicable)
- Presse / partenariats : # TODO créer email dédié

---

## Questions à ajouter au fur et à mesure

À chaque session de testing utilisateur, capturer les 3-5 questions qui
reviennent. Une question dans la FAQ = une question qu'on n'aura pas à
répondre 50 fois en email support.

Idées de sections à ajouter quand le besoin émerge :
- Comparaison avec ChanceCo / l'Etudiant / Studyrama (positionnement)
- Comment installer en PWA / app mobile
- Mode hors-ligne
- API publique (si on en ouvre une)
- Programme partenaire / sponsorisation transparente
