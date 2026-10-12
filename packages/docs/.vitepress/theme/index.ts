import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import Badge from './components/Badge.vue';
import Badges from './components/Badges.vue';
import FetchHistoryCoordinator from './components/figures/FetchHistoryCoordinator.vue';
import FetchHistoryEntries from './components/figures/FetchHistoryEntries.vue';
import FetchHistoryRace from './components/figures/FetchHistoryRace.vue';
import FetchLifecycle from './components/figures/FetchLifecycle.vue';
import FetchUrlDerivation from './components/figures/FetchUrlDerivation.vue';
import PreviewPlayground from './components/PreviewPlayground.vue';
import ReferenceIndex from './components/ReferenceIndex.vue';
import TableOfContent from './components/TableOfContent.vue';
import './custom.css';
import './figures.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Badge', Badge);
    app.component('Badges', Badges);
    app.component('FetchHistoryCoordinator', FetchHistoryCoordinator);
    app.component('FetchHistoryEntries', FetchHistoryEntries);
    app.component('FetchHistoryRace', FetchHistoryRace);
    app.component('FetchLifecycle', FetchLifecycle);
    app.component('FetchUrlDerivation', FetchUrlDerivation);
    app.component('PreviewPlayground', PreviewPlayground);
    app.component('ReferenceIndex', ReferenceIndex);
    app.component('TableOfContent', TableOfContent);
    app.component('Toc', TableOfContent);
    app.use(TwoslashFloatingVue);
  },
};
