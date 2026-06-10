-- ============================================================
-- Migration — Aligner le quota serveur 'coach' sur le système d'énergie
-- ============================================================
-- Depuis l'énergie IA, l'action 'coach' couvre TOUTES les générations perso
-- (lettre, test de recrutement, oral, optimisation CV, session d'entretien IA).
-- Le quota mensuel doit donc être un GARDE-FOU anti-abus (large), pas la limite
-- visible : c'est l'énergie quotidienne (côté client) qui temporise l'usage.
--
-- Énergie : personal/school/cowork = 40/jour (~1240/mois). On met le quota
-- serveur au-dessus pour qu'il ne bloque jamais un usage normal.
-- Free : reste 0 (IA réservée aux plans payants ; gating côté client).
-- ============================================================

update quota_limits set coach_per_month = 1500 where tier in ('personal', 'school', 'cowork');
update quota_limits set coach_per_month = 9999 where tier = 'business';

-- Marge aussi sur la génération de CV pour les plans payants (CV illimités côté
-- produit) — garde-fou large.
update quota_limits set cv_per_month = 1500 where tier in ('personal', 'school', 'cowork');

-- Vérification :
--   select tier, cv_per_month, coach_per_month from quota_limits order by tier;
