import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Base, type BaseConstructor } from '@studiometa/js-toolkit';
import * as uiExports from '@studiometa/ui';
import * as mapboxExports from '@studiometa/ui-mapbox';
import { describe, expect, it } from 'vitest';
import { componentCatalogs } from '../src/component-metadata.js';
import { componentManifest } from '../src/manifest.js';

const packageExports = {
  '@studiometa/ui': uiExports,
  '@studiometa/ui-mapbox': mapboxExports,
} as const;

const excludedNames = [
  'AbstractCarouselChild',
  'AbstractCarouselComponent',
  'AbstractFrameTrigger',
  'AbstractMapboxControl',
  'AbstractMapboxMapChild',
  'AbstractPrefetch',
  'AbstractScrollAnimation',
  'AbstractSliderChild',
  'AccordionProps',
  'MAPBOX_CLUSTER_CONNECTED',
  'MAPBOX_MAP_CONNECTED',
  'TransitionConstructor',
  'animationScrollWithEase',
  'viewTransition',
  'withDeprecation',
  'withIndex',
  'withScrollAnimationDebug',
  'withTransition',
];

function isBaseConstructor(value: unknown): value is BaseConstructor {
  return typeof value === 'function' && value.prototype instanceof Base;
}

describe('component manifest', () => {
  it('represents every concrete public Base constructor exactly once', () => {
    for (const catalog of componentCatalogs) {
      const publicConstructors = Object.entries(packageExports[catalog.packageName])
        .filter(([, value]) => isBaseConstructor(value))
        .map(([name]) => name)
        .filter((name) => !catalog.abstractExports.includes(name))
        .sort();
      const manifestConstructors = Object.values(componentManifest)
        .filter((entry) => entry.packageName === catalog.packageName)
        .map((entry) => entry.exportName)
        .sort();

      expect(manifestConstructors).toEqual(publicConstructors);
      expect(new Set(manifestConstructors).size).toBe(manifestConstructors.length);
    }
  });

  it('keeps tokens and package exports unique', () => {
    const entries = Object.values(componentManifest);
    const tokens = entries.map(({ token }) => token);
    const exports = entries.map(({ packageName, subpath, exportName }) =>
      [packageName, subpath, exportName].join(':'),
    );

    expect(new Set(tokens).size).toBe(tokens.length);
    expect(new Set(exports).size).toBe(exports.length);
    for (const [token, entry] of Object.entries(componentManifest)) {
      expect(entry.token).toBe(token);
    }
  });

  it('excludes abstract classes, helpers, decorators, constants, and types', () => {
    for (const name of excludedNames) {
      expect(componentManifest).not.toHaveProperty(name);
    }
  });

  it('resolves every literal package import to a Base constructor', async () => {
    for (const entry of Object.values(componentManifest)) {
      const Constructor = await entry.load();
      expect(isBaseConstructor(Constructor)).toBe(true);
      expect(packageExports[entry.packageName][entry.exportName]).toBe(Constructor);
    }
  });

  it('uses eager UI and visible Mapbox strategies', () => {
    for (const entry of Object.values(componentManifest)) {
      expect(entry.strategy).toBe(
        entry.packageName === '@studiometa/ui-mapbox' ? 'visible' : 'eager',
      );
    }

    expect(componentManifest.MapboxGeocoder).toMatchObject({
      group: 'mapbox',
      styles: ['mapbox-gl', 'mapbox-geocoder'],
      integrations: ['mapbox-geocoder'],
    });
    expect(componentManifest.FetchShopifyPartial.integrations).toEqual(['shopify']);
  });

  it('models recursive component families and independent Mapbox children', async () => {
    const families = {
      Accordion: ['AccordionItem'],
      AnchorNav: ['AnchorNavLink', 'AnchorNavTarget'],
      Carousel: ['CarouselBtn', 'CarouselDrag', 'CarouselItem', 'CarouselWrapper'],
      Dialog: ['Transition', 'ViewTransition'],
      Disclosure: ['Transition', 'ViewTransition'],
      Frame: ['FrameAnchor', 'FrameForm', 'FrameTarget', 'FrameLoader'],
      FrameAnchor: ['FrameTriggerLoader'],
      FrameForm: ['FrameTriggerLoader'],
      Menu: ['MenuBtn', 'MenuList'],
      MenuList: ['MenuList'],
      ScrollAnimationParent: ['ScrollAnimationChild'],
      ScrollAnimationTimeline: ['ScrollAnimationTarget'],
      Slider: ['SliderItem', 'SliderDrag'],
      Sticky: ['Sentinel'],
    } as const;

    for (const [token, children] of Object.entries(families)) {
      expect(componentManifest[token].children).toEqual(children);
      for (const child of children) {
        expect(componentManifest).toHaveProperty(child);
      }
    }

    const mapboxEntries = Object.values(componentManifest).filter(
      (entry) => entry.packageName === '@studiometa/ui-mapbox',
    );
    for (const entry of mapboxEntries) {
      expect(entry).not.toHaveProperty('children');
    }

    for (const entry of Object.values(componentManifest)) {
      const Constructor = await entry.load();
      const instance = new Constructor(document.createElement('div'));
      expect(entry.children ?? []).toEqual(Object.keys(instance.$config.components ?? {}));
    }
  });

  it('keeps the generated file fresh', () => {
    // Resolve relative to this test file, not process.cwd(), so the check is correct regardless
    // of which working directory the runner uses.
    const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const generatorPath = resolve(packageDirectory, 'scripts/generate-manifest.ts');
    expect(() => execFileSync(process.execPath, [generatorPath, '--check'])).not.toThrow();
  });
});
