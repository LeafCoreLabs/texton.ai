import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

export const authApi = axios.create({
  baseURL: `${BASE_URL}/auth`,
  headers: { 'Content-Type': 'application/json' },
});

export const docApi = axios.create({
  baseURL: `${BASE_URL}/documents`,
  headers: { 'Content-Type': 'application/json' },
});

export const queryApi = axios.create({
  baseURL: `${BASE_URL}/query`,
  headers: { 'Content-Type': 'application/json' },
});
