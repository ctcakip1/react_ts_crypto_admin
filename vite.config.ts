import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Import từ @vitejs/plugin-react-swc

import dns from "dns";
dns.setDefaultResultOrder("verbatim");

export default defineConfig({
    plugins: [react()], // Đúng plugin, không xung đột
    server: {
        port: 3000, // Thay đổi cổng nếu cần
    },
});
