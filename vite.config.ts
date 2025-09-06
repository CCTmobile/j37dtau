import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
// Deployed build configuration for GitHub Pages
export default defineConfig({
  plugins: [react(), tailwindcss(), viteTsconfigPaths()],
  base: '/j37dtau',
});
