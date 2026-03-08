import { config } from "dotenv"
// Load .env.local before any module (including env.ts) is imported
config({ path: ".env.local" })
