import DefaultTheme from 'vitepress/theme';
import Badge from './components/Badge.vue';
import Badges from './components/Badges.vue';
import PreviewPlayground from './components/PreviewPlayground.vue';
import TableOfContent from './components/TableOfContent.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Badge', Badge);
    app.component('Badges', Badges);
    app.component('PreviewPlayground', PreviewPlayground);
    app.component('TableOfContent', TableOfContent);
    app.component('Toc', TableOfContent);
  },
};
