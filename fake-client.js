const axios = require('axios');
const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
});

console.log('trying to login');

let refreshToken;

instance.post('/login', {
  email: 'jeanbon@gmail.com',
  password: 'cuillere'
}).then((response) => {
  console.log('auth success');

  instance.defaults.headers.common['authorization'] = `Bearer ${response.data.accessToken}`;
  refreshToken = response.data.refreshToken;
  loadUserInfos();
}).catch((err) => {
  console.log(err.response.status);
});

function loadUserInfos() {
  instance.get('/me').then((response) => {
    console.log(response.data);
  }).catch((err) => {
    console.log(err.response.status);
  });
}

instance.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.config.url != '/refreshToken' && error.response.status === 401 && originalRequest._retry !== true) {
    originalRequest._retry = true;
    if (refreshToken && refreshToken != '') {
      instance.defaults.headers.common['authorization'] = `Bearer ${refreshToken}`;
      console.log('refresh token');
      await instance.post('/refreshToken').then((response) => {
        instance.defaults.headers.common['authorization'] = `Bearer ${response.data.accessToken}`;
        originalRequest.headers['authorization'] = `Bearer ${response.data.accessToken}`;
      }).catch((error) => {
        console.log(error.response.status);
        refreshToken = null;
      });
      return instance(originalRequest);
    }
  }
});
