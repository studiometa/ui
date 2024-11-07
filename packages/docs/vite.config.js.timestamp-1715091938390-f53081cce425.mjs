// vite.config.js
import { defineConfig } from "file:///Users/Coralie/Sites/studiometa/ui/node_modules/vite/dist/node/index.js";
import Icons from "file:///Users/Coralie/Sites/studiometa/ui/node_modules/unplugin-icons/dist/vite.mjs";
import IconsResolver from "file:///Users/Coralie/Sites/studiometa/ui/node_modules/unplugin-icons/dist/resolver.mjs";
import Components from "file:///Users/Coralie/Sites/studiometa/ui/node_modules/unplugin-vue-components/dist/vite.mjs";
function plainText(match) {
  return {
    name: "plain text",
    transform(code, id) {
      if (typeof match === "string" && new RegExp(match).test(id) || match instanceof RegExp && match.test(id) || typeof match === "function" && match.call(this, code, id)) {
        return `export default ${JSON.stringify(code)}`;
      }
      return code;
    }
  };
}
var config = defineConfig({
  plugins: [
    plainText(/\.twig$/),
    Components({
      resolvers: IconsResolver()
    }),
    Icons({ autoInstall: true })
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://ui.ddev.site",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    watch: {
      ignored: ["!**/node_modules/@studiometa/ui/**", "!**/node_modules/@studiometa/js-toolkit/**"]
    },
    fs: {
      allow: ["../../.."]
    }
  },
  optimizeDeps: {
    include: ["deepmerge"],
    exclude: ["@studiometa/ui", "@studiometa/js-toolkit"]
  }
});
if (process.env.NODE_ENV === "development") {
  globalThis.__DEV__ = true;
  config.define = { __DEV__: true };
}
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvQ29yYWxpZS9TaXRlcy9zdHVkaW9tZXRhL3VpL3BhY2thZ2VzL2RvY3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9Db3JhbGllL1NpdGVzL3N0dWRpb21ldGEvdWkvcGFja2FnZXMvZG9jcy92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvQ29yYWxpZS9TaXRlcy9zdHVkaW9tZXRhL3VpL3BhY2thZ2VzL2RvY3Mvdml0ZS5jb25maWcuanNcIjsvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBJY29ucyBmcm9tICd1bnBsdWdpbi1pY29ucy92aXRlJztcbmltcG9ydCBJY29uc1Jlc29sdmVyIGZyb20gJ3VucGx1Z2luLWljb25zL3Jlc29sdmVyJztcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnO1xuXG4vKipcbiAqIEltcG9ydCBtYXRjaCBhcyBwbGFpbiB0ZXh0LlxuICogQHBhcmFtICAge1JlZ0V4cH0gbWF0Y2hcbiAqIEByZXR1cm5zIHtQbHVnaW59XG4gKi9cbmZ1bmN0aW9uIHBsYWluVGV4dChtYXRjaCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdwbGFpbiB0ZXh0JyxcbiAgICB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKHR5cGVvZiBtYXRjaCA9PT0gJ3N0cmluZycgJiYgbmV3IFJlZ0V4cChtYXRjaCkudGVzdChpZCkpIHx8XG4gICAgICAgIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBtYXRjaC50ZXN0KGlkKSkgfHxcbiAgICAgICAgKHR5cGVvZiBtYXRjaCA9PT0gJ2Z1bmN0aW9uJyAmJiBtYXRjaC5jYWxsKHRoaXMsIGNvZGUsIGlkKSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gYGV4cG9ydCBkZWZhdWx0ICR7SlNPTi5zdHJpbmdpZnkoY29kZSl9YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfSxcbiAgfTtcbn1cblxuY29uc3QgY29uZmlnID0gZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHBsYWluVGV4dCgvXFwudHdpZyQvKSxcbiAgICBDb21wb25lbnRzKHtcbiAgICAgIHJlc29sdmVyczogSWNvbnNSZXNvbHZlcigpLFxuICAgIH0pLFxuICAgIEljb25zKHsgYXV0b0luc3RhbGw6IHRydWUgfSksXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly91aS5kZGV2LnNpdGUnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICBpZ25vcmVkOiBbJyEqKi9ub2RlX21vZHVsZXMvQHN0dWRpb21ldGEvdWkvKionLCAnISoqL25vZGVfbW9kdWxlcy9Ac3R1ZGlvbWV0YS9qcy10b29sa2l0LyoqJ10sXG4gICAgfSxcbiAgICBmczoge1xuICAgICAgYWxsb3c6IFsnLi4vLi4vLi4nXSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ2RlZXBtZXJnZSddLFxuICAgIGV4Y2x1ZGU6IFsnQHN0dWRpb21ldGEvdWknLCAnQHN0dWRpb21ldGEvanMtdG9vbGtpdCddLFxuICB9LFxufSk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgZ2xvYmFsVGhpcy5fX0RFVl9fID0gdHJ1ZTtcbiAgY29uZmlnLmRlZmluZSA9IHsgX19ERVZfXzogdHJ1ZSB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sZ0JBQWdCO0FBT3ZCLFNBQVMsVUFBVSxPQUFPO0FBQ3hCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFVBQVUsTUFBTSxJQUFJO0FBQ2xCLFVBQ0csT0FBTyxVQUFVLFlBQVksSUFBSSxPQUFPLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FDdEQsaUJBQWlCLFVBQVUsTUFBTSxLQUFLLEVBQUUsS0FDeEMsT0FBTyxVQUFVLGNBQWMsTUFBTSxLQUFLLE1BQU0sTUFBTSxFQUFFLEdBQ3pEO0FBQ0EsZUFBTyxrQkFBa0IsS0FBSyxVQUFVLElBQUksQ0FBQztBQUFBLE1BQy9DO0FBRUEsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFNLFNBQVMsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFVBQVUsU0FBUztBQUFBLElBQ25CLFdBQVc7QUFBQSxNQUNULFdBQVcsY0FBYztBQUFBLElBQzNCLENBQUM7QUFBQSxJQUNELE1BQU0sRUFBRSxhQUFhLEtBQUssQ0FBQztBQUFBLEVBQzdCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFNBQVMsQ0FBQyxzQ0FBc0MsNENBQTRDO0FBQUEsSUFDOUY7QUFBQSxJQUNBLElBQUk7QUFBQSxNQUNGLE9BQU8sQ0FBQyxVQUFVO0FBQUEsSUFDcEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsV0FBVztBQUFBLElBQ3JCLFNBQVMsQ0FBQyxrQkFBa0Isd0JBQXdCO0FBQUEsRUFDdEQ7QUFDRixDQUFDO0FBRUQsSUFBSSxRQUFRLElBQUksYUFBYSxlQUFlO0FBRTFDLGFBQVcsVUFBVTtBQUNyQixTQUFPLFNBQVMsRUFBRSxTQUFTLEtBQUs7QUFDbEM7QUFFQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
