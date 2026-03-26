import api from '../config/api';

export const fetchCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

export const fetchActiveCategories = async () => {
  const response = await api.get('/categories/?active_only=true');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/categories/', categoryData);
  return response.data;
};

export const updateCategory = async (categoryId, data) => {
  const response = await api.patch(`/categories/${categoryId}`, data);
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};
