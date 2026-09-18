-- =====================================================================
-- SUGESTÕES DA IA ANTERIORES AO MODELO DE ETAPA ÚNICA → OBSOLETAS
-- =====================================================================
-- A migração `20260917130000_ia_etapa_unica` (`ia_etapa_unica`) trocou o
-- contrato da IA (etapa/estado/motivo em vez de outcome/semântica) e
-- `aplicar_sugestoes_ia` só processa sugestões com `stage_id_sugerido`
-- preenchido. As sugestões geradas antes disso (`stage_id_sugerido IS
-- NULL`) ficaram paradas em `status = 'pendente'` para sempre — nunca
-- serão aplicadas pelo motor novo, e continuavam contando na fila de
-- revisão como se fossem trabalho pendente de verdade (841 das 857
-- sugestões pendentes eram desse tipo).
--
-- Marcá-las como 'obsoleta' as tira da tela de Revisão IA (que filtra por
-- pendente/aplicada/rejeitada em `RevisaoIA.tsx`) sem apagar o histórico.
-- =====================================================================

UPDATE public.ia_sugestoes
   SET status = 'obsoleta'
 WHERE status = 'pendente'
   AND stage_id_sugerido IS NULL;
