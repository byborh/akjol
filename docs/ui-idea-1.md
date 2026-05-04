# AkJol — Update 1 : Exploration rapide façon Skyscanner

> **Problème.** Aujourd'hui l'utilisateur ne peut simuler qu'à partir de **son propre passeport**. Pour répondre à *"et si je faisais une prépa après le bac, et qu'ensuite j'allais en école d'ingé, et qu'après je faisais un master à l'étranger ?"*, il doit éditer son passeport 4–5 fois. C'est lent, c'est lourd, et ça casse la curiosité.
>
> **Cible.** Un collégien teste *"si je fais un bac général, j'ai accès à quoi ?"* → choisit une prépa → *"après cette prépa, je peux faire quelles écoles ?"* → choisit une école → *"après cette école, je vais où ?"* → revient en arrière → essaye une autre prépa. Le tout en **clics simples, sans jamais toucher au passeport réel**.
>
> **Inspiration.** Skyscanner. *Paris → Tokyo direct ? Avec escale à Dubaï ? Avec escale à Singapour ? Et si je pars d'Amsterdam à la place ?* Chaque permutation est à un clic, et l'itinéraire de référence reste visible.

---

## 1. Le mental model : Voyage virtuel vs. passeport réel

On introduit deux notions distinctes dans l'UI :

| | Passeport réel | Voyage virtuel (nouveau) |
| --- | --- | --- |
| Source | Profil persisté de l'utilisateur | État éphémère, en mémoire |
| Modification | 4-5 étapes via `/onboarding` ou `/passport` | 1 clic sur une carte programme |
| Persistance | localStorage (sync) | Session (URL ou store volatile) |
| Visuel | Carte d'identité éducative | Fil d'Ariane / step-stack en haut |
| Rôle | "Là où je suis aujourd'hui" | "Et si j'imaginais ?" |

**Règle d'or :** le passeport réel reste **visible et inchangé** pendant toute exploration. L'utilisateur peut basculer son passeport vers une trajectoire explorée *uniquement* via une action explicite (*"Adopter cette trajectoire"*).

---

## 2. Le composant central : la `TrajectoryBar`

Une **barre persistante en haut de `/explore` et de `/program/[id]`**, juste sous la nav. Elle affiche le fil de l'exploration courante :

```
🇫🇷 Bac général (visé) → 🎯 Prépa MPSI → 🏗️ École d'ingé (en cours d'exploration)
            └── retour                  └── retour                      └── effacer la suite
```

Chaque chip = une étape du voyage virtuel. Clic sur une chip → **on remonte à ce point**, la suite est effacée, l'écran courant se recharge avec ce nouveau "point de départ virtuel". L'utilisateur peut donc *zigzaguer* sans friction.

États visuels :
- **Chip ancrée** (le passeport réel) : drapeau du pays + diplôme actuel, fond doux, badge "réel".
- **Chip explorée** : étape ajoutée par clic, fond `#ee776815`, X au survol pour effacer cette étape uniquement.
- **Chip "fantôme"** (la suite) : pré-vue de l'étape suivante suggérée, opacité 40%, clic pour matérialiser.

---

## 3. Le geste-clé : *"Continuer depuis ici"*

C'est **le** levier du gain d'utilisabilité. Sur **chaque carte programme** (dans `/explore` et dans `/program`), on ajoute un nouveau CTA discret à côté du clic-classique :

| Bouton | Effet |
| --- | --- |
| **Voir la fiche** (déjà là) | Ouvre `/program/[id]` |
| **Continuer depuis ici →** (nouveau) | *Sans modifier le passeport*, recharge `/explore` comme si l'utilisateur avait obtenu ce diplôme. Push l'étape dans la `TrajectoryBar`. |

Concrètement : Léa est sur la fiche "Licence pro ASUR". Elle clique *"Continuer depuis ici →"*. L'app recalcule la liste comme si elle avait validé la Licence pro. Maintenant elle voit les masters MBDS, MIAGE, écoles d'ingé en admission parallèle — qui ne lui étaient pas montrés auparavant car son BTS seul ne suffisait pas.

**Implémentation.** Un store `useTrajectoryStore` (Zustand, non persistant) qui maintient une stack `TrajectoryStep[]`. Le moteur de feasibility consomme un *passeport effectif* = passeport réel + steps appliqués (chaque step met à jour `currentDiploma`, ajoute des certificats, écoule le temps). Le passeport réel n'est jamais touché.

---

## 4. La barre de recherche From → To

Skyscanner a son champ `Origine → Destination`. AkJol aura le sien :

```
Je pars de [Bac général ▾]   et je veux atteindre [Médecin spécialiste ▾]   [Calcule]
```

- **Champ de gauche** = un diplôme actuel ou hypothétique (pré-rempli avec le passeport réel mais éditable inline, sans onboarding).
- **Champ de droite** (optionnel) = un métier, un diplôme final, un pays, ou *"Surprends-moi"*.
- **Résultat** = jusqu'à 5 trajectoires, classées par durée / coût / probabilité (toggleable, comme Skyscanner trie par "Le moins cher / Le plus court / Le mieux").

Cette barre vit en permanence en haut de `/explore`. Pas de modale, pas d'écran intermédiaire — on tape, on a la réponse.

---

## 5. Idées incroyables à intégrer

### 5.1 Layout "Trajectory Builder" à 3 colonnes (desktop)

```
┌──────────────┬──────────────────┬──────────────┐
│ Mon parcours │ Étape courante   │ Étapes       │
│ (sticky left)│ (programmes)     │ suggérées    │
│              │                  │ (preview     │
│ ① Bac général│ Licence pro ASUR │ depuis cette │
│ ② Prépa MPSI │ Bachelor Epitech │ sélection)   │
│ ③ ←→ ici     │ École d'ingé ATS │              │
│              │ Master MBDS      │ → Master IA  │
│              │                  │ → Doctorat   │
│              │                  │ → Job        │
└──────────────┴──────────────────┴──────────────┘
```

- **Colonne 1 (parcours sauvegardé)** : la `TrajectoryBar` mais en vertical, avec drag-to-reorder, supprimer une étape, dupliquer pour brancher.
- **Colonne 2 (étape courante)** : la liste des programmes accessibles depuis le dernier point.
- **Colonne 3 (lookahead)** : pour la carte survolée en colonne 2, on **pré-charge** un aperçu des étapes possibles 1 cran plus loin. L'utilisateur *voit le futur* sans cliquer. C'est le "prefetch émotionnel" — il sait à quoi s'attendre.

Sur mobile : la colonne 1 devient une `TrajectoryBar` en haut, la colonne 3 devient un *peek* au survol/long-press d'une carte.

### 5.2 Mode "Quick swap" sur le diplôme courant

Dans la `TrajectoryBar`, le diplôme actuel est cliquable et ouvre un menu compact (style menu déroulant Skyscanner) :

- **Diplômes du même niveau** (Bac général ↔ Bac techno ↔ Bac pro) → swap instantané, recalcule la liste.
- **Variants** (Bac S ↔ Bac ES ↔ Bac L pour les anciens, ou spécialités math/physique/SVT/SES pour le nouveau bac) → swap instantané.
- *"Avec quelle moyenne ?"* → micro-slider 8→20, recalcule en live (les programmes basculent vert/ambre/rouge sous les yeux).

C'est ce qui transforme AkJol en **outil de jeu**. Un collégien peut tester *"et si j'ai 12 vs 16 de moyenne au bac, quelles écoles s'ouvrent ?"* en 2 secondes, en voyant la carte se métamorphoser.

### 5.3 Trajectoires en URL (deep-link, partage)

Toute trajectoire explorée doit être encodée dans l'URL :

```
/new-ui/explore?from=BAC_GENERAL&via=PREPA_MPSI,ECOLE_INGE_GENERIQUE&aim=MASTER_AI
```

- Permet de **partager une exploration** ("regarde ce parcours, je crois que c'est mon plan").
- Permet de **revenir** à une exploration via l'historique du navigateur, en plus de l'historique AkJol.
- L'URL est la source de vérité pour le `useTrajectoryStore` au mount → React Router style, sans librairie.

### 5.4 Mode "Reverse engineering" : du métier vers le départ

L'utilisateur clique sur un métier (chirurgien, ingénieur cybersécurité, avocat international). AkJol affiche **toutes les routes inversées** possibles depuis le passeport actuel :

```
🩺 Chirurgien orthopédiste
    ├─ Route A — Bac S → PASS → 6 ans Médecine → 5 ans spé    13 ans · €€ · 67% (Léa)
    ├─ Route B — Bac S → LAS → réorientation médecine          14 ans · €€ · 41% (Léa)
    └─ Route C — Bac MY → A-Level UK → Med UK                  15 ans · €€€€ · 22% (Léa)
```

Chaque ligne est une trajectoire complète, cliquable → l'ouvre dans le Trajectory Builder. C'est la version *"Je sais ce que je veux faire, montre-moi les chemins"* — l'inverse de la version *"Je sais d'où je pars, montre-moi les destinations"*.

### 5.5 Le "Multi-curseur" temps / coût / probabilité

En haut de `/explore`, trois sliders **affectent l'affichage en temps réel** (pas un filtre dur — un poids visuel) :

```
Temps   [────●──────]   minimiser ↔ peu importe ↔ je veux long pour bien me former
Coût    [─●─────────]   minimiser ↔ peu importe ↔ je peux mettre cher pour la qualité
Réussite [──────●───]   maximiser ↔ peu importe ↔ je veux du défi
```

Les programmes se réordonnent en live, et un **score composite** s'affiche sur chaque carte. Skyscanner fait pareil avec ses sliders durée / escales / heures de départ.

### 5.6 Comparaison "et si" d'un seul programme

Dans `/program/[id]`, un nouvel encart **"Et si tu changeais une variable ?"** :

```
Si tu avais        14/20 au bac (au lieu de 12)        → 78% (au lieu de 56%)
Si tu avais        TOEFL 95 (au lieu de rien)          → +12pts
Si tu prenais     l'option alternance                  → -€42k coût total
```

Chaque ligne est cliquable et permute la variable dans le voyage virtuel sans toucher au passeport. L'utilisateur **voit ses leviers** explicitement, pas en lisant des paragraphes.

### 5.7 Raccourcis clavier

- `→` / `←` : naviguer entre les programmes de la liste sans la souris.
- `Enter` : *Continuer depuis ici* sur le programme focusé.
- `⌫` Backspace : retirer la dernière étape de la `TrajectoryBar`.
- `/` : focus la barre de recherche From→To.
- `Cmd/Ctrl+S` : sauvegarder la trajectoire courante dans le passeport.
- `?` : panneau d'aide raccourcis.

C'est une **fonctionnalité-puissance** mais elle est ce qui rend les utilisateurs avancés *fluides*. Un conseiller d'orientation qui aide 30 élèves par jour gagne 10 min par élève.

### 5.8 "Timeline" du voyage virtuel

Sous la `TrajectoryBar`, une mini-timeline visuelle :

```
2026 ─── 2028 ─── 2031 ─── 2033 ──── 2035
  │       │        │        │         │
  Bac    Prépa   École     Master   Premier
général  MPSI   d'ingé    spé IA   poste
```

À mesure que l'utilisateur empile des étapes, la timeline s'étire et se met à jour. Un drag-handle à droite permet de **"jusqu'à quand je veux étudier ?"** — un mur temporel qui grise les programmes qui dépasseraient.

### 5.9 Pin et "trips"

Skyscanner a son carnet "Voyages sauvegardés". AkJol a ses **"Plans de vie"** :

- Bouton 📌 *Épingler cette trajectoire* → la sauvegarde nommée dans `/passport` onglet "Mon plan".
- Une trajectoire épinglée garde son URL stable, ses notifications de deadlines, son recalcul auto si le passeport réel évolue.
- Un utilisateur peut épingler **3-5 plans concurrents** et les comparer plus tard via `/compare`.

### 5.10 *"Surprends-moi"* enrichi

Le bouton existant gagne un mode :

- *Surprends-moi (raisonnable)* — trajectoires viables avec proba ≥70%.
- *Surprends-moi (ambitieux)* — trajectoires à 30-50% qui te feraient grandir.
- *Surprends-moi (à l'autre bout du monde)* — corridor géographique non-évident.
- *Surprends-moi (zéro-coût)* — trajectoires gratuites de bout en bout (Allemagne, Norvège, alternance).

### 5.11 Curseur "Avec / sans contraintes"

Toggle global *"Ignore mes contraintes pour voir"*. L'utilisateur peut momentanément lever budget, durée, langue pour **voir ce qui existerait dans un monde idéal**. C'est crucial psychologiquement — beaucoup de jeunes s'auto-censurent. AkJol doit montrer la lumière avant de montrer le mur.

### 5.12 Vue "Carte mentale" du graphe local

Une 3e vue (en plus de "liste" et "globe futur") : `/explore?view=mindmap`. Affiche le diplôme courant au centre, et **toutes les transitions possibles en arborescence** sur 2 niveaux. Chaque nœud cliquable comme dans un node-editor — *mais lecture seule* pour l'étudiant. C'est `/admin/graph` filtré au passeport, lisible.

---

## 6. Plan d'implémentation suggéré

**Étape A — minimum viable (~1 jour).**
1. Créer `useTrajectoryStore` (Zustand non-persistant) avec actions `pushStep`, `popStep`, `clearAfter(index)`, `reset`.
2. Composant `TrajectoryBar` sticky sous la nav, lisant le store.
3. Refactor `computeFeasibility` pour accepter un `effectivePassport` calculé depuis `passport + trajectory`.
4. Ajouter le CTA *"Continuer depuis ici →"* sur `ProgramCard` et dans la sidebar de `/program/[id]`.
5. Mise à jour de `/explore` pour consommer le passeport effectif.

**Étape B — recherche From→To et lookahead (~1 jour).**
6. Barre de recherche au-dessus de la liste, avec autocomplétion sur diplômes/métiers.
7. Pré-calcul du lookahead pour la 1re étape suivante de chaque programme survolé.
8. Encodage URL de la trajectoire (`?from=…&via=…`).

**Étape C — quality of life (~1 jour).**
9. Quick-swap sur le diplôme courant.
10. Multi-curseur temps/coût/réussite.
11. Raccourcis clavier.
12. Encart "Et si" sur la fiche programme.

**Étape D — fonctionnalités riches (~2-3 jours).**
13. Timeline visuelle.
14. Mode reverse-engineering (métier → trajectoires).
15. Vue carte mentale.
16. Pin / Plans de vie / *Surprends-moi* enrichi.

---

## 7. Ce qu'on garde de l'ancienne UI (rappel important)

L'utilisateur a explicitement dit *"laisser l'actuelle version"* — il faut donc préserver les bonnes idées :

- **Partage de "vies"** (URL signée + import) — déjà élégant, à reproduire pour les trajectoires.
- **Visites de formations / établissements** simplifiées — à reprendre comme un onglet dans la fiche programme (*"Demander une visite"*, *"Journée portes ouvertes"*).
- **Modal news / actualités** — à intégrer comme bandeau discret en haut d'`/explore` (*"Parcoursup ouvre dans 12 jours"*).

Ces fonctionnalités ne sont pas remises en cause par la refonte — elles s'**ajoutent** à la grammaire d'exploration rapide.

---

## 8. Critère de succès

Le test qualitatif pour cette update :

> **Un collégien de 14 ans, en moins de 3 minutes, doit pouvoir simuler 5 trajectoires différentes (en partant du même Bac général), sans jamais toucher à son profil, en moins de 15 clics au total.**

Si ce test échoue, l'update n'a pas atteint son but. La métrique qu'on instrumente dans le code : **nombre d'étapes virtuelles parcourues par session** (push events) avant le premier *Pin* ou le premier *Adopter cette trajectoire*. Cible : **médiane ≥ 8**.
