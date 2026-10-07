<script setup lang="ts">
  import { useId } from 'vue';
  import FetchHistoryCoordinator from './FetchHistoryCoordinator.vue';

  const id = useId();
  const marker = `${id}-arrow`;
  const markerBad = `${id}-arrow-bad`;
</script>

<template>
  <figure class="doc-figure" :aria-labelledby="`${id}-caption`">
    <div class="pair">
      <div class="panel">
        <span class="tag bad">v1</span>
        <div class="scroll">
          <svg
            class="dg"
            viewBox="0 0 360 330"
            role="img"
            aria-label="In v1, every Fetch instance with history listens to popstate and requests the restored URL with its own options. The three requests race on the same region and the last response wins.">
            <defs>
              <marker
                :id="marker"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse">
                <path class="mk" d="M0,0 L10,5 L0,10 z" />
              </marker>
              <marker
                :id="markerBad"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse">
                <path class="mk bad" d="M0,0 L10,5 L0,10 z" />
              </marker>
            </defs>

            <rect class="box mute" x="120" y="10" width="120" height="32" rx="6" />
            <text class="mono" x="180" y="30" text-anchor="middle">popstate</text>
            <text class="lbl" x="6" y="58">every instance</text>
            <text class="lbl" x="6" y="72">listens</text>
            <path class="ln" d="M180 42 L62 94" :marker-end="`url(#${marker})`" />
            <path class="ln" d="M180 42 V94" :marker-end="`url(#${marker})`" />
            <path class="ln" d="M180 42 L298 94" :marker-end="`url(#${marker})`" />

            <rect class="box" x="6" y="96" width="112" height="40" rx="6" />
            <rect class="box" x="124" y="96" width="112" height="40" rx="6" />
            <rect class="box" x="242" y="96" width="112" height="40" rx="6" />
            <text x="62" y="120" text-anchor="middle">Fetch #page</text>
            <text x="180" y="120" text-anchor="middle">Fetch #filters</text>
            <text x="298" y="120" text-anchor="middle">Fetch #search</text>

            <path class="ln" d="M62 136 V174" :marker-end="`url(#${marker})`" />
            <path class="ln" d="M180 136 V174" :marker-end="`url(#${marker})`" />
            <path class="ln" d="M298 136 V174" :marker-end="`url(#${marker})`" />
            <rect class="box" x="6" y="176" width="112" height="40" rx="6" />
            <rect class="box" x="124" y="176" width="112" height="40" rx="6" />
            <rect class="box" x="242" y="176" width="112" height="40" rx="6" />
            <text x="62" y="193" text-anchor="middle">own request</text>
            <text x="180" y="193" text-anchor="middle">own request</text>
            <text x="298" y="193" text-anchor="middle">own request</text>
            <text class="mono sub" x="62" y="208" text-anchor="middle">location.href</text>
            <text class="mono sub" x="180" y="208" text-anchor="middle">location.href</text>
            <text class="mono sub" x="298" y="208" text-anchor="middle">location.href</text>

            <path class="ln bad" d="M62 216 L122 254" :marker-end="`url(#${markerBad})`" />
            <path class="ln bad" d="M180 216 V254" :marker-end="`url(#${markerBad})`" />
            <path class="ln bad" d="M298 216 L238 254" :marker-end="`url(#${markerBad})`" />
            <rect class="box bad" x="80" y="256" width="200" height="36" rx="6" />
            <text class="mono" x="180" y="278" text-anchor="middle">#results</text>
            <text class="lbl bad" x="180" y="316" text-anchor="middle">
              three requests race, the last one wins
            </text>
          </svg>
        </div>
      </div>
      <FetchHistoryCoordinator bare tag="v2" />
    </div>
    <!-- prettier-ignore -->
    <figcaption :id="`${id}-caption`">On back navigation in v1, every <code>Fetch</code> with <code>history</code> requests the restored URL with its own options, and the slowest response wins. In v2, one coordinator reads the entry, rebuilds one request from the restored URL and the recipe of the entry, and swaps only the regions the recipe names.</figcaption>
  </figure>
</template>
