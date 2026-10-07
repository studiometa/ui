<script setup lang="ts">
  import { useId } from 'vue';

  defineProps<{
    /** Show how v1 used `src` as a copy of the page, for the migration guide. */
    legacy?: boolean;
  }>();

  const captionId = useId();

  /** The markup of each case, shown as text. */
  const markup = {
    params: `<a href="/projects?page=2" data-option-params='{"view":"fragment"}'>`,
    src: `<form action="/help" data-option-src="/apps/search?view=fragment">`,
    formaction: `<form action="/help" data-option-src="/apps/search" data-option-params='{"view":"fragment"}'> … <button formaction="/elsewhere">`,
    legacy: `<a href="/projects/page/2" data-option-src="/projects/page/2?sections=listing">`,
  };
</script>

<!--
  Prose blocks are marked `prettier-ignore`: the formatter would break the
  text around inline elements and the template compiler would then add a
  space before each comma and period.
-->
<template>
  <figure class="doc-figure" :aria-labelledby="captionId">
    <!-- prettier-ignore -->
    <ol class="steps">
      <li>Origin and path: from <code>src</code> when it is set, otherwise from the destination.</li>
      <li>Query: the query of <code>src</code>, then the query of the destination folded on. Without <code>src</code>, the query of the destination.</li>
      <li><code>params</code> are set last, so they win.</li>
    </ol>
    <div class="cases">
      <div class="case">
        <!-- prettier-ignore -->
        <div class="case-head"><span><code>params</code>: a lighter copy of the same page</span><span class="use">pagination, Shopify sections, <code>view=fragment</code></span></div>
        <div class="markup">{{ markup.params }}</div>
        <div class="row">
          <span class="k">Navigate</span>
          <span class="url">/projects?page=2</span>
          <span class="op">+ params</span>
          <span class="url ok">/projects?page=2&amp;view=fragment</span>
        </div>
        <div class="row">
          <span class="k">Back</span>
          <span class="url">/projects?page=1</span>
          <span class="op">+ params</span>
          <span class="url ok">/projects?page=1&amp;view=fragment</span>
          <span class="verdict ok">right page</span>
        </div>
      </div>
      <div class="case">
        <!-- prettier-ignore -->
        <div class="case-head"><span><code>src</code>: a fixed endpoint</span><span class="use">live search on another endpoint</span></div>
        <div class="markup">{{ markup.src }}</div>
        <div class="row">
          <span class="k">Navigate</span>
          <span class="url">/help?q=shoes</span>
          <span class="op">origin and path from src</span>
          <span class="url ok">/apps/search?view=fragment&amp;q=shoes</span>
        </div>
        <div class="row">
          <span class="k">Back</span>
          <span class="url">/help?q=boots</span>
          <span class="op">origin and path from src</span>
          <span class="url ok">/apps/search?view=fragment&amp;q=boots</span>
          <span class="verdict ok">right results</span>
        </div>
      </div>
      <div class="case">
        <!-- prettier-ignore -->
        <div class="case-head"><span><code>formaction</code>: the submitter names another destination</span><span class="use"><code>src</code> and <code>params</code> are dropped</span></div>
        <div class="markup">{{ markup.formaction }}</div>
        <div class="row">
          <span class="k">Submit</span>
          <span class="url">/elsewhere?q=hello</span>
          <span class="op">no src, no params</span>
          <span class="url ok">/elsewhere?q=hello</span>
        </div>
      </div>
      <div v-if="legacy" class="case bad">
        <!-- prettier-ignore -->
        <div class="case-head"><span>v1: <code>src</code> as a copy of the page</span><span class="use">back requested the restored URL as it is</span></div>
        <div class="markup">{{ markup.legacy }}</div>
        <div class="row">
          <span class="k">v1 back</span>
          <span class="url">/projects/page/1</span>
          <span class="op">src ignored</span>
          <span class="url no">/projects/page/1</span>
          <span class="verdict no">full page</span>
        </div>
        <div class="row">
          <span class="k">v2 back</span>
          <span class="url">/projects/page/1</span>
          <span class="op">+ params</span>
          <span class="url ok">/projects/page/1?sections=listing</span>
          <span class="verdict ok">lighter copy</span>
        </div>
      </div>
    </div>
    <!-- prettier-ignore -->
    <figcaption :id="captionId">The request URL is derived from the destination, so back and forward navigation rebuild it from the restored URL alone. The address bar always shows the destination.<template v-if="legacy"> In v1, back requested the restored URL without <code>src</code>, so a <code>response</code> option that reads JSON from the lighter copy received a full HTML page. In v2, the v1 markup becomes <code>href="/projects/page/2"</code> with <code>data-option-params='{"sections":"listing"}'</code>.</template></figcaption>
  </figure>
</template>
