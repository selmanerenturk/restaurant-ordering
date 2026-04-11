import api from '../config/api';

export const getRestaurantSettings = async () => {
  const response = await api.get('/restaurant_settings/');
  return response.data;
};

export const updateRestaurantSettings = async (data) => {
  const response = await api.patch('/restaurant_settings/', data);
  return response.data;
};

export const getRestaurantAvailability = async () => {
  const response = await api.get('/restaurant_settings/availability');
  return response.data;
};

