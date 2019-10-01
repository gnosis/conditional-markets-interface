export function* product(...arrs) {
  if (arrs.length === 0) yield [];
  else
    for (const h of arrs[0])
      for (const ts of product(...arrs.slice(1))) yield [h, ...ts];
}

export function* combinations(arr, n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`invalid combination size ${n}`);

  if (arr.length < n) {
    return;
  } else if (n === 0) {
    yield [];
  } else if (n === 1) {
    yield* arr.map(el => [el]);
  } else
    for (let i = 0; i < arr.length - n + 1; i++) {
      for (const subTuple of combinations(arr.slice(i + 1), n - 1))
        yield [arr[i], ...subTuple];
    }
}

export function* permutations(arr) {
  if (arr.length === 0) return;
  if (arr.length === 1) yield arr;
  const firstElem = arr[0];
  const restArr = arr.slice(1);
  for (const subPerm of permutations(restArr)) {
    for (let i = 0; i <= restArr.length; i++) {
      const newPerm = subPerm.slice();
      newPerm.splice(i, 0, firstElem);
      yield newPerm;
    }
  }
}
