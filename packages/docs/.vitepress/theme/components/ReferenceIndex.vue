<script setup lang="ts">
  import { computed, ref } from 'vue';
  import {
    allReferenceSymbols,
    componentTaskLabels,
    filterCatalogEntries,
    kindLabels,
    referenceCatalog,
  } from '../../reference/catalog.js';
  import type {
    ReferenceKind,
    ReferencePackage,
    ReferenceStatus,
    ReferenceSurface,
    ReferenceSymbolKind,
  } from '../../reference/types.js';

  const props = withDefaults(
    defineProps<{
      kind?: ReferenceKind;
      mode?: 'entries' | 'overview' | 'symbols';
      showFilters?: boolean;
      symbolKind?: ReferenceSymbolKind;
    }>(),
    {
      kind: undefined,
      mode: 'entries',
      showFilters: false,
      symbolKind: undefined,
    },
  );

  const query = ref('');
  const selectedPackage = ref<ReferencePackage | ''>('');
  const selectedStatus = ref<ReferenceStatus | ''>('');
  const selectedSurface = ref<ReferenceSurface | ''>('');

  const packages = computed(() =>
    [...new Set(referenceCatalog.flatMap((entry) => entry.packages))].sort(),
  );
  const statuses = computed(() =>
    [...new Set(referenceCatalog.map((entry) => entry.status))].sort(),
  );
  const surfaces = computed(() =>
    [...new Set(referenceCatalog.flatMap((entry) => entry.surfaces))].sort(),
  );

  const filteredEntries = computed(() =>
    filterCatalogEntries(referenceCatalog, {
      query: query.value,
      kinds: props.kind ? [props.kind] : undefined,
      packages: selectedPackage.value ? [selectedPackage.value] : undefined,
      statuses: selectedStatus.value ? [selectedStatus.value] : undefined,
      surfaces: selectedSurface.value ? [selectedSurface.value] : undefined,
    }).toSorted((a, b) => a.title.localeCompare(b.title)),
  );

  const groupedEntries = computed(() => {
    if (props.kind !== 'component') {
      return [{ id: props.kind ?? 'all', title: '', entries: filteredEntries.value }];
    }

    return Object.entries(componentTaskLabels)
      .map(([id, title]) => ({
        id,
        title,
        entries: filteredEntries.value.filter((entry) => entry.primaryTask === id),
      }))
      .filter((group) => group.entries.length);
  });

  const filteredSymbols = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase();

    return allReferenceSymbols
      .filter((symbol) => !props.symbolKind || symbol.kind === props.symbolKind)
      .filter((symbol) => !selectedPackage.value || symbol.package === selectedPackage.value)
      .filter((symbol) => !selectedStatus.value || symbol.status === selectedStatus.value)
      .filter((symbol) => !normalizedQuery || symbol.name.toLowerCase().includes(normalizedQuery))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  });

  const overviewSections = computed(() =>
    (Object.keys(kindLabels) as ReferenceKind[]).map((kind) => ({
      kind,
      title: kindLabels[kind],
      count: referenceCatalog.filter((entry) => entry.kind === kind).length,
      href: `/reference/${kind === 'helper' ? 'helpers' : `${kind}s`}/`,
    })),
  );

  function formatValue(value: string) {
    return value
      .replace(/^npm:/, '')
      .replace(/^composer:/, '')
      .replace(/(^|-)\w/g, (match) => match.replace('-', ' ').toUpperCase());
  }
</script>

<template>
  <div v-if="mode === 'overview'" class="reference-overview">
    <a
      v-for="section in overviewSections"
      :key="section.kind"
      :href="section.href"
      class="reference-card">
      <strong>{{ section.title }}</strong>
      <span>{{ section.count }} documented {{ section.count === 1 ? 'item' : 'items' }}</span>
    </a>
    <a href="/reference/types/" class="reference-card">
      <strong>Types</strong>
      <span>
        {{ allReferenceSymbols.filter((symbol) => symbol.kind === 'type').length }} public types
      </span>
    </a>
    <a href="/reference/all-exports/" class="reference-card">
      <strong>All exports</strong>
      <span>{{ allReferenceSymbols.length }} supported symbols</span>
    </a>
  </div>

  <template v-else>
    <form v-if="showFilters" class="reference-filters" @submit.prevent>
      <label>
        <span>Search</span>
        <input v-model="query" type="search" placeholder="Name, alias or keyword" />
      </label>
      <label>
        <span>Package</span>
        <select v-model="selectedPackage">
          <option value="">All packages</option>
          <option v-for="value in packages" :key="value" :value="value">
            {{ formatValue(value) }}
          </option>
        </select>
      </label>
      <label v-if="mode !== 'symbols' && !symbolKind">
        <span>Surface</span>
        <select v-model="selectedSurface">
          <option value="">All surfaces</option>
          <option v-for="value in surfaces" :key="value" :value="value">
            {{ formatValue(value) }}
          </option>
        </select>
      </label>
      <label>
        <span>Status</span>
        <select v-model="selectedStatus">
          <option value="">All statuses</option>
          <option v-for="value in statuses" :key="value" :value="value">
            {{ formatValue(value) }}
          </option>
        </select>
      </label>
    </form>

    <div v-if="mode === 'symbols' || symbolKind" class="reference-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Kind</th>
            <th>Package</th>
            <th>Import path</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="symbol in filteredSymbols"
            :key="`${symbol.package}:${symbol.name}:${symbol.href}`">
            <td>
              <a :href="symbol.href">
                <code>{{ symbol.name }}</code>
              </a>
            </td>
            <td>{{ formatValue(symbol.kind) }}</td>
            <td>
              <code>{{ formatValue(symbol.package) }}</code>
            </td>
            <td>
              <code v-if="symbol.importPath">{{ symbol.importPath }}</code>
              <span v-else>—</span>
            </td>
            <td>
              <span class="reference-status" :data-status="symbol.status">
                {{ formatValue(symbol.status ?? 'stable') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filteredSymbols.length">No symbols match these filters.</p>
    </div>

    <template v-else>
      <section v-for="group in groupedEntries" :key="group.id" class="reference-group">
        <h2 v-if="group.title">{{ group.title }}</h2>
        <div class="reference-list">
          <article v-for="entry in group.entries" :key="entry.id" class="reference-entry">
            <header>
              <a :href="entry.path">
                <strong>{{ entry.title }}</strong>
              </a>
              <span class="reference-status" :data-status="entry.status">
                {{ formatValue(entry.status) }}
              </span>
            </header>
            <p>{{ entry.summary }}</p>
            <footer>
              <code v-for="surface in entry.surfaces" :key="surface">
                {{ surface.toUpperCase() }}
              </code>
              <code v-for="pkg in entry.packages" :key="pkg">{{ formatValue(pkg) }}</code>
            </footer>
          </article>
        </div>
      </section>
      <p v-if="!filteredEntries.length">No reference items match these filters.</p>
    </template>
  </template>
</template>

<style scoped>
  .reference-overview,
  .reference-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
    margin-block: 1.5rem;
  }

  .reference-card,
  .reference-entry {
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .reference-card {
    display: grid;
    gap: 0.35rem;
    color: var(--vp-c-text-1);
    text-decoration: none;
  }

  .reference-card:hover {
    border-color: var(--vp-c-brand-1);
  }

  .reference-card span,
  .reference-entry p {
    color: var(--vp-c-text-2);
  }

  .reference-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 0.75rem;
    margin-block: 1.5rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: var(--vp-c-bg-soft);
  }

  .reference-filters label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .reference-filters input,
  .reference-filters select {
    width: 100%;
    min-height: 2.25rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.4rem;
    padding-inline: 0.6rem;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg);
  }

  .reference-group {
    margin-top: 2rem;
  }

  .reference-entry header,
  .reference-entry footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .reference-entry p {
    margin-block: 0.6rem;
    line-height: 1.5;
  }

  .reference-entry footer code {
    font-size: 0.7rem;
  }

  .reference-status {
    display: inline-block;
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--vp-c-text-2);
    background: var(--vp-c-default-soft);
  }

  .reference-status[data-status='deprecated'] {
    color: var(--vp-c-danger-1);
    background: var(--vp-c-danger-soft);
  }

  .reference-status[data-status='preview'] {
    color: var(--vp-c-warning-1);
    background: var(--vp-c-warning-soft);
  }

  .reference-table-wrap {
    overflow-x: auto;
  }

  .reference-table-wrap table {
    min-width: 48rem;
  }
</style>
