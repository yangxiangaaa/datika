export const getQueryVariable = (variable) => {
  const queryString = window.location.search.slice(1);
  if (!queryString) return '';
  const vars = queryString.split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair[0] === variable) {
      return decodeURIComponent(pair[1] || '');
    }
  }
  return '';
};
