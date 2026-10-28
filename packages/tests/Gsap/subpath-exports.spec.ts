import { test, expect } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import * as barrel from '@studiometa/ui-gsap';
import * as dependencies from '@studiometa/ui-gsap/dependencies';
import GsapDefault, { Gsap as GsapNamed } from '@studiometa/ui-gsap/Gsap';
import GsapStepDefault, { GsapStep as GsapStepNamed } from '@studiometa/ui-gsap/GsapStep';
import GsapTimelineDefault, {
  GsapTimeline as GsapTimelineNamed,
} from '@studiometa/ui-gsap/GsapTimeline';
import packageJson from '../../ui-gsap/package.json' with { type: 'json' };

test.each([
  ['Gsap', GsapDefault, GsapNamed, barrel.Gsap],
  ['GsapStep', GsapStepDefault, GsapStepNamed, barrel.GsapStep],
  ['GsapTimeline', GsapTimelineDefault, GsapTimelineNamed, barrel.GsapTimeline],
])(
  '%s is available at its own subpath as default and named export',
  (_name, def, named, fromBarrel) => {
    expect(def.prototype instanceof Base).toBe(true);
    expect(def).toBe(named);
    expect(def).toBe(fromBarrel);
  },
);

test('the dependencies subpath exports the injection functions', () => {
  expect(dependencies.provideGsap).toBe(barrel.provideGsap);
  expect(dependencies.resolveGsap).toBe(barrel.resolveGsap);
  expect(typeof dependencies.getGsap).toBe('function');
});

test('the private lifecycle modules have no subpath', () => {
  expect(Object.keys(packageJson.exports).toSorted()).toEqual([
    '.',
    './Gsap',
    './GsapStep',
    './GsapTimeline',
    './autoload',
    './dependencies',
    './manifest',
  ]);
});
