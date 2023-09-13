/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			fontFamily: {
				inter: [
					"Inter",
					"Noto Color Emoji",
					"sans-serif"
				],
				'noto-color-emoji': [
					"Noto Color Emoji",
				],
				"intel-mono": ["intelone-mono-font-family-regular", "Consolas", "sans-serif"]
			}
		}
	},
	plugins: [require("@tailwindcss/forms")]
}
