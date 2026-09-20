import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    proxy: Object.fromEntries(
      ["/auth", "/rides", "/commuter", "/driver", "/admin", "/health"].map(
        (prefix) => [
          prefix,
          {
            target: "http://127.0.0.1:5000",
            bypass(req) {
              if (req.headers.accept?.includes("text/html"))
                return "/index.html";
            },
          },
        ],
      ),
    ),
  },
});
