export const createQueryString = params => {
  return Object.keys(params)
    .map(key => {
      if (params[key]) {
        return key + "=" + params[key];
      }
    })
    .join("&");
};
