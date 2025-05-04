import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import Badge from './components/Badge.vue';
import Badges from './components/Badges.vue';
import PreviewPlayground from './components/PreviewPlayground.vue';
import IframePreviewPlayground from './components/IframePreviewPlayground.vue';
import TableOfContent from './components/TableOfContent.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Badge', Badge);
    app.component('Badges', Badges);
    app.component('PreviewPlayground', PreviewPlayground);
    app.component('IframePreviewPlayground', IframePreviewPlayground);
    app.component('TableOfContent', TableOfContent);
    app.component('Toc', TableOfContent);
    app.use(TwoslashFloatingVue);
  },
};
