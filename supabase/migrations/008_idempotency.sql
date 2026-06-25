-- external_id harus unik per user agar retry tidak menggandakan transaksi
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_external_id_uniq
  ON public.transactions (user_id, external_id)
  WHERE external_id IS NOT NULL;
