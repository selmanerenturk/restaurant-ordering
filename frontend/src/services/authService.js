import api from '../config/api';

export const loginSeller = async (email, password, turnstileToken) => {
  const response = await api.post('/auth/login', {
  email,
   password,
    turnstile_token: turnstileToken,
    });
  return response.data;
};

export const registerSeller = async (formData, turnstileToken) => {
  const response = await api.post('/auth/register', {
    ...formData,
    turnstile_token: turnstileToken,
  });
  return response.data;
};
