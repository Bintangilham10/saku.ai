# Technical Specification: Saku AI - Asisten Keuangan Pintar Mahasiswa

**Author:** Bintangilham10

**Stack:** Next.js (App Router), shadcn/ui (Tailwind), Supabase (Postgres + Realtime + Storage), Clerk (Authentication), ai-sdk (server-side AI assistant).

## 1. Overview & Goals
Membangun aplikasi web yang berfungsi sebagai *chatbot* pengelola keuangan dan *dashboard* interaktif khusus untuk mahasiswa. Pengguna dapat mencatat pemasukan (uang saku/gaji part-time) dan pengeluaran, memantau riwayat data di *dashboard*, mengatur batas jajan, serta meminta saran personal dari *chatbot* terkait cara berhemat atau alokasi dana bulanan. *Chatbot* Saku AI menggunakan data transaksi pengguna untuk memberikan saran yang relevan dan dapat ditindaklanjuti.

**Tujuan Utama (MVP):**
* Pencatatan & tampilan transaksi (manual dan *import* CSV).
* Kategorisasi (manual + *rule-based* + saran berbasis ML sederhana).
* *Dashboard* dengan metrik tren pengeluaran, saldo, dan progres batas jajan (*budget*).
* Antarmuka *chat* berbekal `ai-sdk` untuk menjawab pertanyaan dan memberikan saran penghematan.
* Keamanan autentikasi via Clerk dan *row-level access control* (RLS) di Supabase.

**Non-goals (MVP):**
* Integrasi mutasi bank otomatis (Plaid/BCA API) — *fitur lanjutan opsional*.
* Laporan pajak atau saran investasi profesional (menghindari saran finansial yang diregulasi).

## 2. High-level Architecture
* **Frontend (Next.js + shadcn):** Halaman klien (*Dashboard, Transactions, Accounts, Budgets, Goals, Chat*). Menggunakan *server components* untuk pengambilan data yang aman. Menggunakan Supabase *client* untuk pembaruan *realtime* dan *edge functions* untuk operasi sensitif.
* **Auth (Clerk):** Pendaftaran/Login pengguna. Clerk menyediakan ID pengguna yang stabil dan info profil dasar.
* **DB & Realtime (Supabase):** Penyimpanan data utama (PostgreSQL). Langganan *realtime* untuk pembaruan instan di antarmuka pengguna.
* **AI layer (ai-sdk):** Pemanggilan sisi server untuk menghasilkan respons dan saran *chat*. Menggunakan *retrieval-augmented generation* (RAG) untuk memberikan konteks (baik berupa ringkasan teragregasi maupun pencarian vektor dari transaksi terbaru).
* **Storage (Supabase Storage):** Penyimpanan untuk *upload* struk belanja, dokumen CSV, dan laporan ekspor.

**Diagram (Textual):**
```text
Browser <--> Next.js (client/server) <--> Supabase (Postgres + Realtime + Storage)
                                       \--> ai-sdk (server-side) (memanggil LLM vendor/hosted)
                                       \--> Optional: Bank Sync Service via edge function
3. Core Features (MVP & Advanced)
Fitur MVP

Auth & onboarding: Pendaftaran Clerk, profil dasar (mata uang, zona waktu).

Transaksi manual: Tambah/edit/hapus, lampirkan foto struk kopi/makanan.

Kategori & tag: Kategori standar mahasiswa (Kos, UKT, Makan, Nongkrong) + kategori/tag kustom.

Budgets & goals: Batas pengeluaran bulanan per kategori, target tabungan (misal: Beli Laptop).

Dashboard: Saldo sisa uang saku, tren pengeluaran bulanan, rincian kategori, progres budget.

CSV import/export: Unggah cepat untuk memasukkan data awal.

Chatbot (ai-sdk): Menjawab pertanyaan seperti "Gimana cara ngurangin pengeluaran makan di luar?" atau "Apakah uang 200 ribu cukup sampai minggu depan?"

Laporan Dasar: Pengeluaran 3 bulan terakhir, merchant yang paling sering dikunjungi (misal: Warmindo, Gojek).

Advanced / Phase 2

Bank aggregation: Sinkronisasi bank/e-wallet otomatis (Qris/Gopay).

Auto-categorization ML: Menggunakan embeddings + classifier untuk mengkategorikan transaksi otomatis.

Forecasting & simulation: Memproyeksikan saldo berdasarkan pemasukan/pengeluaran rutin (seperti langganan Netflix/Spotify).

Dukungan Multi-currency: Konversi FX otomatis jika mahasiswa kuliah di luar negeri.

Collaborative accounts: Fitur patungan (split bill) sesama teman kos/kelompok tugas.

4. User Flows
Onboarding

Pengguna mendaftar dengan Clerk (email atau Google).

Sistem meminta pengguna mengatur zona waktu dan target uang saku.

Menawarkan opsi: import CSV atau mulai dari buku kas kosong.

Adding a transaction (manual)

Klik + Transaksi Baru → buka modal atau quick-add.

Input: nominal, tanggal, akun (tunai/bank), merchant, kategori (disarankan), tag, dan foto struk.

Aplikasi menyimpan transaksi -> Supabase -> UI diperbarui via Realtime.

Chat conversation

Pengguna membuka tab Chat dan menanyakan status keuangannya.

Frontend mengirimkan request ke endpoint server /api/chat dengan pesan pengguna dan konteks singkat (ringkasan keuangan bulan ini).

Server menggunakan ai-sdk untuk membangun prompt (system + agregasi konteks) dan mengembalikan respons ke klien.

Opsi tindakan: Pengguna dapat menerima saran (misalnya, membuat aturan budget baru), yang memicu mutasi pada database.

5. Database Schema (Postgres, Supabase)
Prinsip inti: Akses berbasis pemilik, auditability, meminimalkan data pribadi (PII) untuk AI (lebih memilih agregasi), menggunakan indeks pada kueri user_id dan date.

Extensions to enable:

SQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- untuk pencarian fuzzy (opsional)
-- pgvector untuk vector search transaksi (opsional)
Core tables (DDL snippets):

users

SQL
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  email text,
  display_name text,
  preferred_currency varchar(3) DEFAULT 'IDR',
  timezone text DEFAULT 'Asia/Jakarta',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
accounts

SQL
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- dompet|bank|ewallet|tabungan
  currency varchar(3) DEFAULT 'IDR',
  institution text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON accounts (user_id);
categories

SQL
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id),
  auto_rules jsonb, -- e.g. aturan berdasarkan nama merchant
  color varchar(7),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON categories (user_id);
transactions

SQL
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  currency varchar(3) DEFAULT 'IDR',
  type text NOT NULL, -- debit|credit
  category_id uuid REFERENCES categories(id),
  merchant text,
  description text,
  date date NOT NULL,
  status text DEFAULT 'cleared', -- pending|cleared
  imported boolean DEFAULT false,
  external_id text, -- dari bank/CSV
  tags text[],
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON transactions (user_id, date DESC);
CREATE INDEX ON transactions (account_id);
CREATE INDEX ON transactions USING gin (tags);
budgets

SQL
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  period text NOT NULL, -- bulanan|mingguan
  limit_amount numeric(14,2) NOT NULL,
  start_date date,
  end_date date,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
recurring_rules

SQL
CREATE TABLE recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id),
  amount numeric(14,2) NOT NULL,
  currency varchar(3) DEFAULT 'IDR',
  category_id uuid REFERENCES categories(id),
  cron_expr text, 
  next_occurrence timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ai_conversations / ai_messages

SQL
CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  title text,
  context jsonb, -- konteks high-level untuk obrolan AI
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text, -- user|assistant|system
  content text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
imports & audit_logs

SQL
CREATE TABLE imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id),
  filename text,
  status text,
  mapping jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  table_name text,
  row_id uuid,
  action text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);
6. Row-Level Security & Access Model
Prinsip: Setiap baris dimiliki oleh user_id dan hanya pengguna tersebut yang dapat mengaksesnya. Ditegakkan melalui kebijakan RLS Supabase.

SQL
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mahasiswa hanya dapat melihat transaksinya sendiri" ON transactions
  FOR ALL
  USING (auth.uid() = user_id::text)
  WITH CHECK (auth.uid() = user_id::text);
Catatan Autentikasi Clerk: Untuk mengintegrasikan Clerk dengan Supabase RLS, aplikasikan penukaran token (session exchange) JWT Clerk dengan JWT Supabase menggunakan klaim sub = Clerk user ID, atau jalankan semua penulisan client melalui Next.js Server Actions yang memvalidasi sesi Clerk secara internal sebelum memanggil admin service key Supabase.

7. AI Integration (ai-sdk)
Pendekatan:

Gunakan panggilan ai-sdk di sisi server (jangan pernah memanggil LLM langsung dari browser).

Buat prompt yang terdiri dari: Instruksi sistem, ringkasan profil mahasiswa yang dianomimkan, dan pesan user.

Untuk menjaga agar ukuran prompt tetap kecil, lakukan agregasi transaksi (total per kategori, pengeluaran bulan lalu, biaya langganan kos) alih-alih mengirim daftar transaksi mentah yang panjang.

Prompt template (example):

Plaintext
SYSTEM: Kamu adalah Saku AI, asisten keuangan untuk mahasiswa. Gunakan bahasa santai dan berikan 3 saran penghematan yang bisa langsung dipraktikkan.
CONTEXT: {aggregated_summary}
USER: {user_input}
ASSISTANT:
Safety & Privacy:

Hindari mengirim PII mentah (nama merchant lengkap, lokasi detail) ke LLM eksternal tanpa persetujuan.

Jangan simpan secara permanen output AI yang berisi data sensitif kecuali pengguna setuju (opt-in).

8. API Surface (examples)
Endpoint yang dilindungi autentikasi (server-side):

GET /api/transactions?from=&to=&limit=&cursor= — daftar transaksi (dengan paginasi)

POST /api/transactions — buat baru

PUT /api/transactions/:id — perbarui data

DELETE /api/transactions/:id — hapus data

POST /api/imports — unggah file CSV

GET /api/dashboard/summary — agregasi statistik untuk kecepatan muat dashboard

POST /api/chat — meneruskan pesan ke ai-sdk, mengembalikan stream respon asisten

9. UI / Pages & Components
Pages:

/ — Dashboard (Kartu: Saldo, pengeluaran bulan ini, progres budget)

/transactions — Daftar, pencarian, filter

/transactions/new — Modal quick-add

/accounts — Akun Dompet/E-wallet/Bank

/budgets — Pengaturan batas jajan & peringatan (alerts)

/goals — Target tabungan mahasiswa

/chat — Antarmuka chatbot utama Saku AI

Key reusable components (shadcn): Sidebar, Topbar, TransactionRow, BudgetCard, ChartCard, ChatWindow, QuickAdd.

UX Notes:

Autocomplete otomatis untuk nama merchant dan kategori langganan (Gojek -> Transport).

Inline edit pada baris transaksi agar cepat mengubah nominal.

Satu klik untuk mengubah saran chatbot AI menjadi aturan budget otomatis.

10. Non-functional Requirements
Security: Validasi data mutlak di sisi server, penyimpanan terenkripsi untuk lampiran struk di storage.

Privacy: Minimalkan data ke model pihak ketiga; berikan tombol putar opt-in yang jelas.

Performance: Precompute agregat dasbor menggunakan materialized views atau pekerjaan malam (nightly cron) untuk waktu muat yang jauh lebih cepat.

Scalability: Penambahan indeks pada user_id dan date. Gunakan partisi tabel jika volume data transaksi mahasiswa membesar.

11. Monitoring, Testing & QA
Logging: Sentry/LogRocket di frontend; log server spesifik untuk kegagalan panggilan API ai-sdk.

Metrics: Daily Active Users (DAU), rata-rata transaksi yang ditambahkan, rasio konversi saat saran Saku AI diterapkan oleh pengguna.

Testing: Unit test pada logika agregasi saldo, E2E (Playwright/Cypress) untuk alur pencatatan, dan tes integrasi khusus parsing CSV.

12. Roadmap & Milestones
MVP (4–6 minggu)

Integrasi Auth (Clerk) + Skema dasar Supabase + Scaffolding UI shadcn.

Pencatatan transaksi manual, kategori dasar, visualisasi dasbor.

Unggah CSV, fungsi pencarian & filter.

Endpoint /api/chat dengan Vercel AI SDK dan pengiriman context dasar.

Phase 2 (2–3 bulan)

Pengenalan otomatis nama struk via ML, mesin recurring rules untuk bayar kos/UKT otomatis.

Proyeksi prediksi keuangan akhir bulan.

Phase 3 (Ongoing)

Fitur pembagian tagihan sesama teman (Split bill), integrasi layanan portofolio.

13. Acceptance Criteria / Success Metrics
Mahasiswa dapat mendaftar dan mencatat pengeluaran pertama dalam waktu < 3 klik.

Dashboard merender visualisasi pengeluaran dengan akurat dari seed data 3 bulan ke belakang.

Saku AI dapat merespons pertanyaan dasar dengan 3 saran hemat yang actionable.

Aplikasi otomatis mengirimkan peringatan (UI alert) saat kategori (misal: "Nongkrong") menyentuh 90% dari batas jajan bulanan.

14. Implementation Tips & Gotchas
Clerk + Supabase: Clerk adalah source of truth untuk identitas pengguna. Jangan bergantung buta pada auth.uid() di Supabase kecuali kamu melakukan mapping yang sesuai dari JWT Clerk ke Supabase.

AI Costs: Batasi ukuran token (prompt); agregasi ringkasan terlebih dulu; gunakan layanan caching untuk pertanyaan yang berulang-ulang dari user yang sama.

Timezone & Currency: Selalu simpan timestamp dalam UTC di PostgreSQL (timestamptz) dan konversi ke zona waktu lokal pengguna hanya di sisi klien/visualisasi.

Appendix: Example Aggregated Summary to send to AI
User summary (Bulan Ini):

Total Pemasukan/Uang Saku: Rp 3.500.000

Total Pengeluaran Saat Ini: Rp 2.800.000

Top 3 Pengeluaran: Kos (Rp 1.000.000), Makan (Rp 800.000), Transport (Rp 300.000)

Langganan Rutin (Recurring): Spotify Rp 50.000/bulan, Wi-Fi Patungan Rp 75.000/bulan

Target Tabungan: Beli Laptop Baru Rp 5.000.000 (Saat ini terkumpul Rp 1.500.000)