-- COME-AND-FIGHT — ajustements pour matcher exactement le contrat DarePay
-- (doc "Recevoir le callback") : payment_id (DarePay), reference (nous),
-- transaction_id (DarePay). provider_reference existant devient le
-- transaction_id ; on ajoute merchant_reference (notre "reference" métier)
-- et provider_payment_id (le "payment_id" DarePay).

alter table public.payments
  add column merchant_reference text,
  add column provider_payment_id bigint,
  add column failure_reason text;

-- Table vide à ce stade du projet : on peut imposer not null + unique direct.
update public.payments set merchant_reference = id::text where merchant_reference is null;
alter table public.payments alter column merchant_reference set not null;
create unique index payments_merchant_reference_key on public.payments(merchant_reference);

comment on column public.payments.provider_reference is 'transaction_id renvoyé par DarePay (identifiant unique de la transaction)';
comment on column public.payments.merchant_reference is 'reference métier que nous générons et envoyons à DarePay à la création du paiement';
comment on column public.payments.provider_payment_id is 'payment_id interne DarePay (numérique)';
