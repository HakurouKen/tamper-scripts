interface ScreenOrientation {
  /* [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) */
  lock: (
    orientation:
      | 'any'
      | 'natural'
      | 'landscape'
      | 'portrait'
      | 'portrait-primary'
      | 'portrait-secondary'
      | 'landscape-primary'
      | 'landscape-secondary'
  ) => Promise<void>;
}
