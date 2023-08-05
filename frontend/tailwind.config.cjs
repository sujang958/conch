/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			fontFamily: {
				pretendard: [
					"Pretendard Variable",
					"Pretendard",
					"-apple-system",
					"BlinkMacSystemFont",
					"system-ui",
					"Roboto",
					"Helvetica Neue",
					"Segoe UI",
					"Apple SD Gothic Neo",
					"Noto Sans KR",
					"Malgun Gothic",
					"Apple Color Emoji",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"sans-serif"
				],
				"intel-mono": ["intelone-mono-font-family-regular", "Consolas", "sans-serif"]
			}
		}
	},
	plugins: [require("@tailwindcss/forms")]
}
