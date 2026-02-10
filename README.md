# Amara

Amara is a robust TypeScript application integrating with Supabase.

## Setup

1.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Update `.env` with your Supabase credentials:
    *   `SUPABASE_URL`: Your project URL (e.g., `https://xyz.supabase.co`)
    *   `SUPABASE_KEY`: Your Anon Public Key
3.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Demo

To run the Supabase connection demo:

```bash
npx ts-node examples/supabase_demo.ts
```

## Testing

Run the tests using Jest:

```bash
npm test
```
