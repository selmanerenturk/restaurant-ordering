import api from '../config/api';

export const getProductOptions = async (productId) => {
  const response = await api.get(`/product_options/product/${productId}`);
  return response.data;
};

export const getOption = async (optionId) => {
  const response = await api.get(`/product_options/${optionId}`);
  return response.data;
};

export const createOption = async (optionData) => {
  const response = await api.post('/product_options/', optionData);
  return response.data;
};

export const updateOption = async (optionId, optionData) => {
  const response = await api.patch(`/product_options/${optionId}`, optionData);
  return response.data;
};

export const deleteOption = async (optionId) => {
  const response = await api.delete(`/product_options/${optionId}`);
  return response.data;
};

export const createOptionItem = async (optionId, itemData) => {
  const response = await api.post(`/product_options/${optionId}/items`, itemData);
  return response.data;
};

export const updateOptionItem = async (itemId, itemData) => {
  const response = await api.patch(`/product_options/items/${itemId}`, itemData);
  return response.data;
};

export const deleteOptionItem = async (itemId) => {
  const response = await api.delete(`/product_options/items/${itemId}`);
  return response.data;
};
