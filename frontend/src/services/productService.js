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

export const updateProduct = async (productId, data) => {
  const response = await api.patch(`/products/${productId}`, data);
  return response.data;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/products/upload-image', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data; // { imageurl: "/uploads/products/xxx.jpg" }
};

