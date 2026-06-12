# Saku AI

Saku AI adalah aplikasi web asisten keuangan untuk mahasiswa. Aplikasi ini membantu pengguna mencatat pemasukan dan pengeluaran, melihat ringkasan uang saku, memantau budget per kategori, mengatur target tabungan, dan bertanya ke chatbot Saku AI dengan konteks data keuangan pengguna.

## Fitur Utama

- Dashboard ringkasan saldo, pemasukan, pengeluaran, savings rate, tren bulanan, dan breakdown kategori.
- Pencatatan transaksi manual dengan akun, kategori, merchant, tanggal, dan tipe transaksi.
- Halaman akun untuk melihat saldo dan aktivitas per dompet, bank, e-wallet, atau tabungan.
- Budget kategori dengan progres dan alert saat limit mendekati batas.
- Target tabungan mahasiswa.
- Chat Saku AI berbasis `ai-sdk` yang memakai ringkasan data keuangan, bukan daftar transaksi mentah panjang.
- Mode demo saat Clerk atau Supabase belum dikonfigurasi.

## Tech Stack

- Next.js 15 App Router
- React 19 dan TypeScript
- Tailwind CSS v4
- shadcn/ui
- Clerk untuk autentikasi
- Supabase untuk database dan RLS
- Vercel AI SDK dengan OpenAI atau Anthropic
- Recharts untuk visualisasi dashboard

## Menjalankan Lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Buat `.env.local` dan isi konfigurasi yang dibutuhkan:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

   OPENAI_API_KEY=sk-...
   # atau
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Jalankan development server:

   ```bash
   npm run dev
   ```

4. Buka `http://localhost:3000`.

Tanpa konfigurasi Clerk/Supabase, aplikasi tetap dapat dibuka dalam mode demo dengan data contoh.

## Struktur Project

```text
src/
  app/
    page.tsx                  # Dashboard
    transactions/page.tsx     # Riwayat dan tambah transaksi
    accounts/page.tsx         # Ringkasan akun
    budgets/page.tsx          # Budget kategori
    goals/page.tsx            # Target tabungan
    chat/page.tsx             # Chat Saku AI
    api/
      chat/route.ts
      dashboard/summary/route.ts
      transactions/route.ts
  components/
    chat.tsx
    dashboard-charts.tsx
    forecast-card.tsx
    quick-add-transaction.tsx
    saku-shell.tsx
    ui/
  lib/
    saku-data.ts
    saku-demo.ts
    saku-types.ts
    supabase.ts
    ml/
supabase/
  migrations/
```

## Database

Skema Supabase ada di `supabase/migrations/`. Tabel utama mencakup:

- `app_users`
- `accounts`
- `categories`
- `transactions`
- `budgets`
- `goals`
- `recurring_rules`

Setiap tabel data pengguna memakai `user_id` dan Row Level Security agar data antar pengguna tetap terpisah.

Tabel untuk import, percakapan tersimpan, dan audit masih tersedia di skema sebagai ruang pengembangan berikutnya, tetapi belum menjadi fitur aktif di UI.

## Catatan Fitur

Fitur yang sudah tampil di UI harus punya alur yang benar-benar bisa dipakai. Placeholder yang belum siap, seperti tombol import/export tanpa handler, sebaiknya tidak ditampilkan dulu sampai implementasinya lengkap.

Detail rancangan produk ada di `tech_doc.md`.
