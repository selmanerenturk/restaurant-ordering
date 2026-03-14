import api from '../config/api';

export const fetchProductsWithDefaultPrices = async () => {
  const response = await api.get('/products/with_default_prices');
  return response.data;
};

export const fetchProductsWithPrices = async () => {
  const response = await api.get('/products/with_prices');
  return response.data;
};

export const fetchProductWithPrices = async (productId) => {
  const response = await api.get(`/products/${productId}/with_prices`);
  return response.data;
};
