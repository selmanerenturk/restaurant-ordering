import api from '../config/api';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};
