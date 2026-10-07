<script setup lang="ts">
  import { useId } from 'vue';

  defineProps<{
    /** Render only the drawing, for a `.pair` that a parent figure holds. */
    bare?: boolean;
    /** The label above the drawing. */
    tag?: string;
  }>();

  const id = useId();
  const marker = `${id}-arrow`;
</script>

<template>
  <component
    :is="bare ? 'div' : 'figure'"
    :class="bare ? 'panel' : 'doc-figure'"
    :aria-labelledby="bare ? undefined : `${id}-caption`">
    <span v-if="tag" class="tag acc">{{ tag }}</span>
    <div class="scroll">
      <svg
        class="dg"
        viewBox="0 0 360 410"
        role="img"
        aria-label="One history coordinator handles popstate. On back and forward, it stops the navigation in flight, which a jump to an anchor of the page leaves alone. It ignores an entry without a fetch key, sends no request when only the hash differs from the content on the page, reloads the page when no class can restore the entry, and otherwise lets the mounted instance on the owner element run the restore, or a detached instance whose events reach document. One GET request is rebuilt from the restored URL and the recipe, and the regions that match the selectors of the page's entries are swapped.">
        <defs>
          <marker
            :id="marker"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse">
            <path class="mk acc" d="M0,0 L10,5 L0,10 z" />
          </marker>
        </defs>

        <rect class="box mute" x="120" y="10" width="120" height="32" rx="6" />
        <text class="mono" x="180" y="30" text-anchor="middle">popstate</text>
        <path class="ln dash" d="M120 26 H86" />
        <text class="lbl" x="6" y="16">no fetch key,</text>
        <text class="lbl" x="6" y="29">or hash only:</text>
        <text class="lbl" x="6" y="42">no request</text>

        <path class="ln acc" d="M180 42 V74" :marker-end="`url(#${marker})`" />
        <rect class="box acc" x="70" y="76" width="220" height="44" rx="6" />
        <text class="strong" x="180" y="94" text-anchor="middle">history coordinator</text>
        <text class="mono sub" x="180" y="111" text-anchor="middle">reads history.state.fetch</text>
        <path class="ln dash" d="M290 98 H300" />
        <text class="lbl" x="304" y="94">no class:</text>
        <text class="lbl" x="304" y="108">reload</text>

        <path class="ln acc" d="M180 120 L95 158" :marker-end="`url(#${marker})`" />
        <path class="ln acc" d="M180 120 L270 158" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="6" y="140">owner mounted</text>
        <text class="lbl" x="354" y="140" text-anchor="end">owner gone</text>

        <rect class="box" x="6" y="160" width="174" height="48" rx="6" />
        <text x="93" y="180" text-anchor="middle">live instance on #owner</text>
        <text class="sub" x="93" y="197" text-anchor="middle">events on its element</text>
        <rect class="box" x="190" y="160" width="164" height="48" rx="6" />
        <text x="272" y="180" text-anchor="middle">detached instance</text>
        <text class="sub" x="272" y="197" text-anchor="middle">events on document</text>

        <path class="ln acc" d="M93 208 L160 250" :marker-end="`url(#${marker})`" />
        <path class="ln acc" d="M272 208 L200 250" :marker-end="`url(#${marker})`" />
        <rect class="box" x="60" y="252" width="240" height="44" rx="6" />
        <text class="mono" x="180" y="270" text-anchor="middle">GET /projects?page=1</text>
        <text class="sub" x="180" y="287" text-anchor="middle">
          rebuilt from the URL and the recipe
        </text>

        <path class="ln acc" d="M180 296 V334" :marker-end="`url(#${marker})`" />
        <text class="lbl acc" x="188" y="314">swaps the selectors</text>
        <text class="lbl acc" x="188" y="327">of the page's entries</text>
        <rect class="box acc" x="80" y="336" width="200" height="36" rx="6" />
        <text class="mono" x="180" y="358" text-anchor="middle">#results</text>
        <text class="lbl acc" x="180" y="396" text-anchor="middle">
          one owner, one request, one swap
        </text>
      </svg>
    </div>
    <!-- prettier-ignore -->
    <figcaption v-if="!bare" :id="`${id}-caption`"><slot>One coordinator holds the only <code>popstate</code> listener of the page. It reads the recipe of the entry, finds who runs the restore, rebuilds one GET request from the restored URL and swaps the regions that the entries of the page name, so a region that a later entry changed comes back too. The owner is found by the <code>id</code> of the element that wrote the entry.</slot></figcaption>
  </component>
</template>
