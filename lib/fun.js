export const require = (src) => {
  return fetch(src).then((response) => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.text();
  });
};
