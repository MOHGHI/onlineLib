# Kitoblar — Multilingual Online Bookstore

A React + TypeScript + Supabase bookstore: catalog, cart, checkout, digital
downloads, quick-buy for e-books, an admin dashboard, and full EN/UZ/RU
localization.

## Try it locally

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Database

Run the SQL files under `supabase/migrations/` in order (Supabase dashboard →
SQL Editor, or `supabase db push` if you're linked with the CLI) to set up
the schema.

Demo admin login (seeded by migration `0005`): `admin@kitoblar.uz` /
`Admin123!`.

## Live demo

_Add the deployed URL here once it's live._
