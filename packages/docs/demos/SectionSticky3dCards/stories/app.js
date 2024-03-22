import { Base, createApp } from 'https://cdn.skypack.dev/@studiometa/js-toolkit';
import { ScrollAnimationParent } from 'https://cdn.skypack.dev/@studiometa/ui';

class App extends Base {
	static config = {
		name: 'App',
		components: {
			ScrollAnimationParent,
		}
	};
}

createApp(App)
