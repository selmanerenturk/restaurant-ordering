import api from '../config/api';

export const fetchProductPrices = async () => {
  const response = await api.get('/product_prices/');
  return response.data;
};

export const createProductPrice = async (priceData) => {
  const response = await api.post('/product_prices/', priceData);
  return response.data;
};

export const updateProductPrice = async (priceId, data) => {
  const response = await api.patch(`/product_prices/${priceId}`, data);
  return response.data;
};

export const deleteProductPrice = async (priceId) => {
  const response = await api.delete(`/product_prices/${priceId}`);
  return response.data;
};
