module.exports = {
	darkMode: 'class',
	content: [
		'./src/js/**/*.ts',
		'./src/js/**/*.vue',
		'./src/templates/**/*.twig',
		'./src/templates/**/*.yml',
		'./node_modules/@studiometa/ui/**/*.twig',
		'./node_modules/@studiometa/ui/**/*.js',
		'tailwind.safelist.txt',
	],
	theme: {
		extend: {
			keyframes: {
				loader: {
					'0%': { transform: 'rotate(0)' },
					'100%': { transform: 'rotate(720deg)' },
				},
			},
			animation: {
				loader: 'loader 1s ease-in-out infinite',
			}
		},
	},
};
