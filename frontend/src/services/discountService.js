import api from '../config/api';

export const getDiscounts = async () => {
  const response = await api.get('/discounts/');
  return response.data;
};

export const createDiscount = async (data) => {
  const response = await api.post('/discounts/', data);
  return response.data;
};

export const updateDiscount = async (discountId, data) => {
  const response = await api.patch(`/discounts/${discountId}`, data);
  return response.data;
};

export const deleteDiscount = async (discountId) => {
  const response = await api.delete(`/discounts/${discountId}`);
  return response.data;
};

export const getActiveDiscountsMap = async () => {
  const response = await api.get('/discounts/active-map');
  return response.data;
};

