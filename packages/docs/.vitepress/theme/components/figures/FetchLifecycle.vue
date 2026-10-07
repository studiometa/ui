<script setup lang="ts">
  import { useId } from 'vue';

  const id = useId();
  const marker = `${id}-arrow`;
  const markerBad = `${id}-arrow-bad`;
</script>

<template>
  <figure class="doc-figure" :aria-labelledby="`${id}-caption`">
    <div class="scroll">
      <svg
        class="dg"
        viewBox="0 0 720 810"
        role="img"
        style="min-width: 520px"
        aria-label="Request lifecycle. The main path runs from fetch-before through the request in flight, fetch-response, the parse, a first check that the request is still the latest, fetch-update-before, a second check that commits the request, writing history, applying the DOM change inside js-toolkit:dom:update, fetch-update-after and fetch-after with outcome ok. A request superseded or aborted while in flight sends fetch-abort and fetch-after with outcome aborted at once, and stops at the next check. A cancelled fetch-before goes straight to fetch-after aborted. A network error, a status that is not ok, a parse failure or a failed DOM change sends fetch-error and fetch-after with outcome error. When the swap removed the element, the last events also reach its nearest connected ancestor or document.">
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

        <!-- main path -->
        <rect class="box" x="255" y="10" width="210" height="40" rx="6" />
        <text class="mono" x="360" y="27" text-anchor="middle">fetch-before</text>
        <text class="sub" x="360" y="41" text-anchor="middle">cancelable, request can change</text>
        <path class="ln" d="M360 50 V78" :marker-end="`url(#${marker})`" />

        <rect class="box" x="255" y="80" width="210" height="40" rx="6" />
        <text x="360" y="97" text-anchor="middle">request in flight</text>
        <text class="sub" x="360" y="111" text-anchor="middle">the client sends the request</text>
        <path class="ln" d="M360 120 V148" :marker-end="`url(#${marker})`" />

        <rect class="box" x="255" y="150" width="210" height="40" rx="6" />
        <text class="mono" x="360" y="167" text-anchor="middle">fetch-response</text>
        <text class="sub" x="360" y="181" text-anchor="middle">the response arrived</text>
        <path class="ln" d="M360 190 V218" :marker-end="`url(#${marker})`" />

        <rect class="box" x="255" y="220" width="210" height="40" rx="6" />
        <text x="360" y="237" text-anchor="middle">parse the response</text>
        <text class="sub" x="360" y="251" text-anchor="middle">
          response option, parseResponse()
        </text>
        <path class="ln" d="M360 260 V288" :marker-end="`url(#${marker})`" />

        <path class="box acc" d="M360 290 L460 320 L360 350 L260 320 Z" />
        <text class="strong" x="360" y="324" text-anchor="middle">still the latest?</text>
        <path class="ln" d="M360 350 V378" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="368" y="369">yes</text>

        <rect class="box" x="255" y="380" width="210" height="40" rx="6" />
        <text class="mono" x="360" y="397" text-anchor="middle">fetch-update-before</text>
        <text class="sub" x="360" y="411" text-anchor="middle">content parsed, DOM unchanged</text>
        <path class="ln" d="M360 420 V448" :marker-end="`url(#${marker})`" />

        <path class="box acc" d="M360 450 L460 480 L360 510 L260 480 Z" />
        <text class="strong" x="360" y="484" text-anchor="middle">still the latest?</text>
        <path class="ln" d="M360 510 V538" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="368" y="529">yes: committed, abort() no longer stops it</text>

        <rect class="box" x="255" y="540" width="210" height="40" rx="6" />
        <text x="360" y="557" text-anchor="middle">write history, if on</text>
        <text class="sub" x="360" y="571" text-anchor="middle">a POST only after a redirect</text>
        <path class="ln" d="M360 580 V608" :marker-end="`url(#${marker})`" />

        <rect class="box" x="255" y="610" width="210" height="40" rx="6" />
        <text x="360" y="627" text-anchor="middle">apply the DOM change</text>
        <text class="sub" x="360" y="641" text-anchor="middle">inside js-toolkit:dom:update</text>
        <path class="ln" d="M360 650 V678" :marker-end="`url(#${marker})`" />

        <rect class="box" x="255" y="680" width="210" height="40" rx="6" />
        <text class="mono" x="360" y="704" text-anchor="middle">fetch-update-after</text>
        <path class="ln" d="M360 720 V748" :marker-end="`url(#${marker})`" />

        <rect class="box acc" x="255" y="750" width="210" height="40" rx="18" />
        <text class="mono" x="360" y="767" text-anchor="middle">fetch-after</text>
        <text class="sub acc" x="360" y="781" text-anchor="middle">outcome: ok</text>

        <!-- aborted -->
        <path class="ln dash" d="M465 30 H712 V240 H702" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="472" y="23">cancelled</text>
        <path class="ln" d="M465 100 H605 V148" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="472" y="93">superseded or abort()</text>
        <rect class="box mute" x="510" y="150" width="190" height="40" rx="6" />
        <text class="mono" x="605" y="167" text-anchor="middle">fetch-abort</text>
        <text class="sub" x="605" y="181" text-anchor="middle">
          only in flight, before the commit
        </text>
        <path class="ln" d="M605 190 V218" :marker-end="`url(#${marker})`" />
        <rect class="box mute" x="510" y="220" width="190" height="40" rx="18" />
        <text class="mono" x="605" y="237" text-anchor="middle">fetch-after</text>
        <text class="sub" x="605" y="251" text-anchor="middle">outcome: aborted</text>

        <path class="ln dash" d="M460 320 H605 V378" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="470" y="313">no</text>
        <path class="ln dash" d="M460 480 H605 V422" :marker-end="`url(#${marker})`" />
        <text class="lbl" x="470" y="473">no</text>
        <rect class="box mute" x="510" y="380" width="190" height="40" rx="6" />
        <text x="605" y="397" text-anchor="middle">stops, events already sent</text>
        <text class="sub" x="605" y="411" text-anchor="middle">no DOM change, no history</text>

        <!-- error -->
        <path class="ln bad" d="M255 100 H40 V678" :marker-end="`url(#${markerBad})`" />
        <text class="lbl bad" x="248" y="93" text-anchor="end">network error</text>
        <path class="ln bad" d="M255 240 H40" />
        <text class="lbl bad" x="248" y="233" text-anchor="end">status not ok, or parse fails</text>
        <path class="ln bad" d="M255 630 H115 V678" :marker-end="`url(#${markerBad})`" />
        <text class="lbl bad" x="248" y="623" text-anchor="end">DOM change throws</text>
        <rect class="box bad" x="20" y="680" width="190" height="40" rx="6" />
        <text class="mono" x="115" y="697" text-anchor="middle">fetch-error</text>
        <text class="sub" x="115" y="711" text-anchor="middle">request or DOM change failed</text>
        <path class="ln bad" d="M115 720 V748" :marker-end="`url(#${markerBad})`" />
        <rect class="box bad" x="20" y="750" width="190" height="40" rx="18" />
        <text class="mono" x="115" y="767" text-anchor="middle">fetch-after</text>
        <text class="sub bad" x="115" y="781" text-anchor="middle">outcome: error</text>

        <!-- events after the swap -->
        <path class="ln dash" d="M478 682 H486 V788 H478" />
        <text class="lbl" x="494" y="722">if the swap removed the element,</text>
        <text class="lbl" x="494" y="737">these events also reach its nearest</text>
        <text class="lbl" x="494" y="752">connected ancestor, or document</text>
      </svg>
    </div>
    <!-- prettier-ignore -->
    <figcaption :id="`${id}-caption`">Every request ends with exactly one <code>fetch-after</code>, and its <code>outcome</code> says how. A request superseded or aborted while in flight sends <code>fetch-abort</code> and <code>fetch-after</code> at once, then stops at the next check without a DOM change. A request cancelled in <code>fetch-before</code> never starts, so it skips <code>fetch-abort</code>. Once committed, a request ends <code>ok</code> or <code>error</code>, and once failed, <code>error</code>. A new request waits for the <code>fetch-after</code> of such a request before its own <code>fetch-before</code>. A view transition that fails around a successful DOM change is a diagnostic, not an error.</figcaption>
  </figure>
</template>
