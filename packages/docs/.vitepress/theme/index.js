import Badge from './components/Badge.vue';
import Badges from './components/Badges.vue';
import Tabs from './components/Tabs.vue';
import PreviewIframe from './components/PreviewIframe.vue';
import Layout from './components/Layout.vue';
import NotFound from './components/NotFound.vue';
import RenderTwig from './components/RenderTwig.vue';
import './custom.scss';

export default {
  Layout,
  NotFound,
  enhanceApp({ app }) {
    app.component('Badge', Badge);
    app.component('Badges', Badges);
    app.component('Tabs', Tabs);
    app.component('PreviewIframe', PreviewIframe);
    app.component('RenderTwig', RenderTwig);
  },
};
