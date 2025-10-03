import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
    theme: { extend: {} },
    plugins: [require("tailwindcss-animate"),],
};

export default config;
