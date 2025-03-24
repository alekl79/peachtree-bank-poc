// src/api.ts
import axios from 'axios';
import type { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';

// Map integer states to friendly labels
const stateLabels: Record<string, string> = {
  '0': 'Sent',
  '1': 'Received',
  '2': 'Paid'
};

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:7080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Error handler helper function
const handleApiError = (error: any, customMessage?: string): never => {
  const message = customMessage || 'An error occurred';
  console.error(error);
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 401) {
      toast.error('Authentication failed. Please log in again.');
      // Optionally trigger a logout or redirect to login page
    }
    if (axiosError.response) {
      // Server responded with an error status
      toast.error(`${message}: ${axiosError.response.status} - ${axiosError.response.statusText}`);
    } else if (axiosError.request) {
      // Request was made but no response received
      toast.error(`${message}: Network error - No response from server`);
    } else {
      // Something else happened
      toast.error(`${message}: ${axiosError.message}`);
    }
  } else {
    // Not an axios error
    toast.error(`${message}: ${error.message || 'Unknown error'}`);
  }
  
  throw error; // Re-throw for component handling
};

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  created: string;
  state: string;
  lastStateUpdate: string;  
  version: number;
}

// Update the interface to match the new response format
export interface TransactionResponse {
  data: Transaction[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  activeFilters: {
    q: string;
    sortBy: string;
    sortDirection: string;
  };
}

// GET all transactions
export const fetchTransactions = async (
  q: string = '', 
  page: number = 1, 
  pageSize: number = 10, 
  sortBy: string = 'created', 
  sortDirection: string = 'desc'
): Promise<TransactionResponse> => {
  try {
    const response = await apiClient.get<TransactionResponse>(
      `/transactions/${page}/${pageSize}?q=${q}&sortBy=${sortBy}&sortDirection=${sortDirection}`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch transactions');
  }
};

// GET a transaction by id
export const fetchTransactionById = async (id: string): Promise<Transaction> => {
  try {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch transaction ${id}`);
  }
};

// POST a new transaction
export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    const response = await apiClient.post<Transaction>('/transactions', transaction);
    toast.success('Transaction created successfully!');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create transaction');
  }
};

// PUT: update transaction state
export const updateTransactionState = async (id: string, state: string): Promise<void> => {
  try {
    await apiClient.put(`/transactions/${id}/state/${state}`);
    toast.success(`Transaction status updated to ${stateLabels[state] || state}`);
  } catch (error) {
    handleApiError(error, `Failed to update transaction state to ${stateLabels[state] || state}`);
  }
};