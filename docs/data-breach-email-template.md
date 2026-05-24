# Template — Email de notification de violation de données

À utiliser en cas d'incident de sécurité touchant des données personnelles.
Cohérent avec l'art. 34 RGPD (notification à la personne concernée si risque
élevé pour ses droits et libertés).

**Avant d'envoyer :**
- Remplir TOUS les `[À COMPLÉTER]` ci-dessous.
- Faire relire par un avocat si possible.
- Notifier la CNIL en parallèle (≤ 72h après prise de connaissance).
- Tenir un registre interne : qui a reçu, quand, contenu envoyé.

---

## Sujet de l'email

`[AkJol] Information importante concernant la sécurité de tes données`

## Corps (français)

---

Bonjour [PRÉNOM],

Je t'écris pour t'informer d'un incident de sécurité concernant AkJol, qui
peut avoir affecté tes données personnelles.

### Ce qui s'est passé

Le [DATE INCIDENT], nous avons découvert [DESCRIPTION FACTUELLE — ex : « un
accès non autorisé à notre base de données utilisateurs »]. L'incident a été
[CONTENU / TOUJOURS EN COURS — préciser].

### Quelles données ont été potentiellement exposées

Les données suivantes, qui te concernent, ont pu être consultées :
- [PRÉCISER : email, nom, hash du mot de passe, passeport éducation, etc.]
- Ne sont **pas** concernées : [PRÉCISER ce qui n'est pas touché]

Important : nous **ne stockons pas** de mots de passe en clair. Les mots de
passe sont chiffrés (bcrypt cost 12). Cela rend leur exploitation
significativement plus difficile, mais ne la rend pas impossible.

### Ce que nous avons fait

- [ACTION 1 — ex : « Nous avons immédiatement coupé l'accès et corrigé la
  vulnérabilité. »]
- [ACTION 2 — ex : « Nous avons invalidé toutes les sessions actives ; il te
  faudra te reconnecter. »]
- [ACTION 3 — ex : « Nous avons notifié la CNIL dans les 72h, conformément au
  RGPD. »]

### Ce que tu dois faire

1. **Change ton mot de passe AkJol** dès maintenant si tu utilises un mot de
   passe : [LIEN /account].
2. **Si tu réutilises ce mot de passe ailleurs**, change-le aussi sur ces
   autres services. La règle générale : un mot de passe unique par service.
3. **Sois vigilant face aux emails frauduleux** te prétendant venir d'AkJol et
   te demandant des informations sensibles dans les semaines qui viennent.
   Nous ne te demanderons jamais ton mot de passe par email.

### Si tu veux supprimer ton compte

Tu peux le faire à tout moment depuis [LIEN /account]. La suppression est
définitive et nous effaçons toutes tes données sous 30 jours.

### Tes droits

Tu peux à tout moment :
- Demander une copie de tes données (droit d'accès) : écris à
  contact@akjol.app.
- Faire une réclamation auprès de la CNIL :
  [www.cnil.fr/fr/plaintes](https://www.cnil.fr/fr/plaintes).

### Pour nous contacter

Pour toute question sur cet incident : [EMAIL_DPO ou contact@akjol.app].

Je sais que ce genre de message est désagréable à recevoir. On prend la
sécurité de tes données au sérieux — cet incident est l'occasion de revoir
toute notre infra et de renforcer ce qui doit l'être. Je suis désolé pour
les inquiétudes que ça peut causer.

[PRÉNOM/NOM] — Directeur de la publication, AkJol

---

## Corps (English version — optional)

À traduire au moment de l'incident si la base utilisateurs est multilingue.
Garder le même contenu factuel, ne pas adoucir ni dramatiser.

---

## Checklist envoi

- [ ] Liste des destinataires verrouillée (exporter la query SQL utilisée pour
      pouvoir prouver l'exhaustivité)
- [ ] Tous les `[À COMPLÉTER]` remplis
- [ ] Relu par 2 personnes minimum (toi + 1 autre)
- [ ] Date + heure d'envoi notées dans le runbook de l'incident
- [ ] CNIL notifiée AVANT ou EN PARALLÈLE (jamais après les utilisateurs)
- [ ] Compte twitter/LinkedIn AkJol prêt à répondre publiquement aux
      questions/critiques
