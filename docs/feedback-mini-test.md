# Retours mini-test — corrections restantes

> **Statut au 2026-05-14.** Les blocs 1, 2 et 3 issus du mini-test du
> 2026-05-13 (10 retours collectés) sont **livrés et commités**. Seul le
> chantier **Admin CRUD** reste — volontairement différé en attendant la
> refonte data (cf. [data-architecture.md](data-architecture.md)).
>
> Pour le détail de ce qui a été fait sur les blocs 1/2/3, voir l'historique
> git (commits dédiés par bloc).

---

## Chantier différé — Admin CRUD complet

**Retour adressé :** #7

### À ne PAS faire maintenant

L'utilisateur a explicitement mentionné que ce chantier ne doit pas être
attaqué tant que la base de données n'est pas stabilisée. C'est correct :
construire un CRUD sur un schéma qui va changer dans 2 semaines = double
travail.

### Pré-requis avant d'attaquer

1. Refonte data terminée (cf. [data-architecture.md](data-architecture.md))
2. Tables `schools`, `formation_types`, `programs` (jointure) en place
3. Index FTS5 actif pour la recherche admin

### Périmètre cible (à scoper finement le moment venu)

- `/admin/schools` — liste paginée + filtres + édition inline
- `/admin/formations` — idem pour les types de formation
- `/admin/programs` — éditeur de jointures avec autocomplete UAI + FOR.xxxxx
- `/admin/ingest` — déclencher / monitorer les runs d'ingestion depuis l'UI
- `/admin/users` — promote/demote rôles (le script CLI `promote-curator.ts`
  devient un fallback)
- Toujours role-gated par le middleware existant.

### Quand y revenir

Après le soft launch + refonte data. Sprint dédié 2-3 jours.

---

## Méta — comment l'agent doit travailler

1. **Lire ce doc en entier avant de toucher au code.**
2. **Lire le bloc complet** avant de commencer ses sous-tâches.
3. **Commit par bloc**, pas par sous-tâche — un bloc forme une unité cohérente
   testable.
4. **Toujours `pnpm typecheck`** avant chaque commit. Cible : 6/6 vert.
5. **Demander à l'humain** sur les décisions produit (slogan, choix de logo,
   options de traduction qui changent le ton).
6. **Ne pas inventer de feature** non listée — si quelque chose semble utile
   mais hors scope du bloc, l'écrire dans un TODO en bas de ce doc, pas le
   coder.
7. **Tester en runtime** (`pnpm dev`) après chaque bloc, pas seulement le
   typecheck. Le typecheck dit que les types collent, pas que les pages
   ouvrent.
