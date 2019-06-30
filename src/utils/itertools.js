export function* product(...arrs) {
  if (arrs.length === 0) {
    yield [];
  } else {
    for (const h of arrs[0]) {
      for (const ts of product(...arrs.slice(1))) {
        yield [h, ...ts];
      }
    }
  }
}

export function* combinations(arr, n) {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new Error(`invalid combination size ${n}`);
  }

  if (arr.length < n) {
    return;
  } else if (n === 0) {
    yield [];
  } else if (n === 1) {
    yield* arr.map(el => [el]);
  } else {
    for (let i = 0; i < arr.length - n + 1; i++) {
      for (const subTuple of combinations(arr.slice(i + 1), n - 1)) {
        yield [arr[i], ...subTuple];
      }
    }
  }
}
