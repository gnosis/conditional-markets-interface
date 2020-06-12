export const createQueryString = params => {
  return Object.keys(params)
    .reduce((acc, key) => {
      if (params[key]) {
        acc.push(key + "=" + params[key]);
      }
      return acc;
    }, [])
    .join("&");
};
