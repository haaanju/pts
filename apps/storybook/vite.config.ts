import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tokensModule } from "./scripts/docs-tokens.ts";

export default defineConfig({
  // tokensModule: the token data the docs read, built by Terrazzo (ADR 0038)
  plugins: [react(), tokensModule()],
});
