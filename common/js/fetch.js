export const getData = (url, level = 2, mode = 'cors', includeCredentials = false) => {
  return fetch(url, {
    method: 'GET',
    mode,
    credentials: includeCredentials ? 'include' : 'same-origin',
  });
};

export const postData = (url, data, level = 2, contentType = 'json', includeCredentials = false) => {
  const headers = {};
  let body = data;
  if (contentType === 'json') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  }
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: includeCredentials ? 'include' : 'same-origin',
    headers,
    body,
  });
};
