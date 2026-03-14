import api from '../config/api';

export const fetchProductPrices = async () => {
  const response = await api.get('/product_prices/');
  return response.data;
};

export const createProductPrice = async (priceData) => {
  const response = await api.post('/product_prices/', priceData);
  return response.data;
};
