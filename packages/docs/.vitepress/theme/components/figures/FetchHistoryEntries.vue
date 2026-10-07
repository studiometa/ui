<script setup lang="ts">
  import { useId } from 'vue';

  const captionId = useId();

  const stamped = `{
  ...otherKeys,
  fetch: { … the same recipe },
}`;

  const pushed = `{
  ...otherKeys,
  fetch: {
    component: 'Fetch',
    owner: 'pager',
    selector: '#results',
    mode: 'replace',
    params: { view: 'fragment' },
    // src: an absolute URL, when set
    response: 'response.text()',
    headers: {},
    viewTransition: true,
  },
}`;

  const foreign = `{ router: { … } }`;
</script>

<!--
  Prose blocks are marked `prettier-ignore`: the formatter would break the
  text around inline elements and the template compiler would then add a
  space before each comma and period.
-->
<template>
  <figure class="doc-figure" :aria-labelledby="captionId">
    <div class="entries">
      <div class="entry">
        <span class="idx">Entry 0 · first load</span>
        <span class="u">/projects</span>
        <pre><code>{{ stamped }}</code></pre>
        <!-- prettier-ignore -->
        <span class="how"><b>Stamped</b> with <code>replaceState()</code> just before the first push. Without it, back to the page as first loaded would find no recipe.</span>
      </div>
      <div class="entry">
        <span class="idx">Entry 1 · after a click</span>
        <span class="u">/projects?page=2</span>
        <pre><code>{{ pushed }}</code></pre>
        <!-- prettier-ignore -->
        <span class="how"><b>Pushed</b> with the full destination, its own hash included. The keys of other scripts are kept. <code>append</code> and <code>prepend</code> are stored as <code>replace</code>, so a restore does not add the content twice. A subclass adds its own options, such as <code>partials</code>.</span>
      </div>
      <div class="entry other">
        <span class="idx">Entry 2 · another script</span>
        <span class="u">/projects?page=2#map</span>
        <pre><code>{{ foreign }}</code></pre>
        <!-- prettier-ignore -->
        <span class="how"><b>Not written by <code>Fetch</code>.</b> There is no <code>fetch</code> key, so the coordinator ignores the entry and keeps its state as it is.</span>
      </div>
    </div>
    <!-- prettier-ignore -->
    <ol class="steps">
      <li>Back from entry 2 to entry 1: the coordinator finds a recipe, but the page already shows <code>/projects?page=2</code> and only the hash differs, so it sends no request.</li>
      <li>Back from entry 1 to entry 0: it requests <code>/projects?view=fragment</code> and swaps <code>#results</code>.</li>
      <li>A mounted instance of <code>component</code> on the <code>owner</code> element runs the restore, so its events and loading states apply. Without one, a detached instance runs it and its events reach <code>document</code>.</li>
    </ol>
    <!-- prettier-ignore -->
    <figcaption :id="captionId">Three entries on one page. <code>Fetch</code> restores the two it wrote when the page shows other content, and leaves the third alone. A recipe is plain data, so back and forward navigation still work after the element that wrote the entry has left the page.</figcaption>
  </figure>
</template>
