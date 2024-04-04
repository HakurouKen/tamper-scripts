import { NAMESPACE } from './constants';

const isDebugOn = localStorage.getItem(`${NAMESPACE}_debug`) === '1';

function noop() {}

export const logger = new Proxy(console, {
  get(target, prop: keyof Console) {
    if (isDebugOn) {
      return target[prop];
    }
    return noop;
  }
});
