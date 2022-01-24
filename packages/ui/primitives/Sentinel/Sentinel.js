import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';

export default class Sentinel extends withIntersectionObserver(Base, { threshold: [0, 1] }) {
  static config = {
    name: 'Sentinel',
  };
}
