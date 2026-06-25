-- 007_amount_minor.sql
-- Pindah representasi uang ke integer (minor units, mis. sen/rupiah penuh).

-- 1. Tambah kolom baru (nullable dulu agar non-breaking)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS amount_minor bigint;

-- 2. Backfill dari kolom numeric lama.
--    Konvensi sementara: semua amount disimpan sebagai unit mayor 2-desimal,
--    sehingga minor unit = amount * 100. Untuk IDR 0-desimal, sesuaikan
--    backfill jika nanti diputuskan menyimpan rupiah penuh sebagai minor unit.
UPDATE public.transactions
SET amount_minor = round(amount * 100)::bigint
WHERE amount_minor IS NULL;

-- 3. Enforce setelah backfill
ALTER TABLE public.transactions
  ALTER COLUMN amount_minor SET NOT NULL;

-- 4. CHECK guard (opsional, sesuaikan aturan bisnis)
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_minor_finite
  CHECK (amount_minor BETWEEN -922337203685477 AND 922337203685477);
