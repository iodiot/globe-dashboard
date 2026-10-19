/** Memoise on the identity of the last arguments (like reselect / memoize-one). */
export function memoLast<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | null = null;
  let last!: R;
  return (...args: A) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => Object.is(a, lastArgs![i]))) return last;
    lastArgs = args;
    last = fn(...args);
    return last;
  };
}
