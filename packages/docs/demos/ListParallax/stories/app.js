import { Base, createApp } from 'https://cdn.skypack.dev/@studiometa/js-toolkit';
import { ScrollAnimation } from 'https://cdn.skypack.dev/@studiometa/ui';

class Parallax extends ScrollAnimation {
	get $options() {
		return {
			...super.$options,
			from: { y: 0 },
			to: { y: [-10, '%'] },
			offset: 'start start / end end'
		};
	}
}

class App extends Base {
	static config = {
		name: 'App',
		components: {
			ScrollAnimation,
			Parallax,
		},
	};
}

createApp(App);
