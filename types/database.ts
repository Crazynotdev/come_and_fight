/**
 * Stub volontairement permissif (Database = any) en attendant la génération
 * réelle des types Supabase :
 *   npx supabase gen types typescript --project-id jtcqftiedhszvczpjlkw > types/database.ts
 * Un stub trop strict fait remonter des `never` sur les colonnes non
 * modélisées et casse le typecheck sans apporter de vraie sécurité tant que
 * le schéma n'est pas généré pour de vrai — `any` est le choix honnête ici.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Database = any;
