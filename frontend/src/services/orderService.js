import api from '../config/api';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const getOrders = async (status = null, skip = 0, limit = 50) => {
  const params = { skip, limit };
  if (status) params.status = status;
  const response = await api.get('/orders/', { params });
  return response.data;
};

export const getOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

export const getOrdersCount = async (status = null) => {
  const params = {};
  if (status) params.status = status;
  const response = await api.get('/orders/count', { params });
  return response.data;
};
