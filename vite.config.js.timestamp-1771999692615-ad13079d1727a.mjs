// vite.config.js
import { defineConfig } from "file:///C:/Users/acer/Documents/EduNorm/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/acer/Documents/EduNorm/node_modules/@vitejs/plugin-react/dist/index.js";
import { nodePolyfills } from "file:///C:/Users/acer/Documents/EduNorm/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    })
  ],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
          "vendor-utils": ["jspdf", "html2canvas", "xlsx", "idb"],
          "vendor-mega": ["megajs"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhY2VyXFxcXERvY3VtZW50c1xcXFxFZHVOb3JtXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhY2VyXFxcXERvY3VtZW50c1xcXFxFZHVOb3JtXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hY2VyL0RvY3VtZW50cy9FZHVOb3JtL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbi8vIEZvcmNlIFJlc3RhcnQ6IDIwMjYtMDItMTYgMjA6MjBcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIHJlYWN0KCksXG4gICAgICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXG4gICAgICAgICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgICAgIH0pLFxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICAgIG9wZW46IHRydWVcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLWZpcmViYXNlJzogWydmaXJlYmFzZS9hcHAnLCAnZmlyZWJhc2UvYXV0aCcsICdmaXJlYmFzZS9maXJlc3RvcmUnLCAnZmlyZWJhc2Uvc3RvcmFnZSddLFxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLXV0aWxzJzogWydqc3BkZicsICdodG1sMmNhbnZhcycsICd4bHN4JywgJ2lkYiddLFxuICAgICAgICAgICAgICAgICAgICAndmVuZG9yLW1lZ2EnOiBbJ21lZ2FqcyddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDBcbiAgICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5UixTQUFTLG9CQUFvQjtBQUV0VCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxxQkFBcUI7QUFFOUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBO0FBQUEsTUFFVixpQkFBaUI7QUFBQSxJQUNyQixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILGVBQWU7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNKLGNBQWM7QUFBQSxVQUNWLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxtQkFBbUIsQ0FBQyxnQkFBZ0IsaUJBQWlCLHNCQUFzQixrQkFBa0I7QUFBQSxVQUM3RixnQkFBZ0IsQ0FBQyxTQUFTLGVBQWUsUUFBUSxLQUFLO0FBQUEsVUFDdEQsZUFBZSxDQUFDLFFBQVE7QUFBQSxRQUM1QjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUMzQjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
