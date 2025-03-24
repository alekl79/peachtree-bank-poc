import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { getAuth } from 'firebase/auth';
import { useSnackbar } from './contexts/SnackbarContext';

// First, let's define the Transaction interface that was missing
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

const apiClient = axios.create({
  baseURL: 'https://localhost:7080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include auth token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    // Ensure headers object exists
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, (error: unknown) => {
  return Promise.reject(error);
});

// Create a singleton instance of the snackbar functions
let showError: (message: string) => void;
let showSuccess: (message: string) => void;

export const initializeSnackbar = (
  errorFn: (message: string) => void,
  successFn: (message: string) => void
) => {
  showError = errorFn;
  showSuccess = successFn;
};

// Error handler helper function
const handleApiError = (error: unknown, customMessage?: string): never => {
  const message = customMessage || 'An error occurred';
  console.error(error);
  
  // Use the imported isAxiosError type guard
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      showError('Authentication failed. Please log in again.');
      // Optionally trigger a logout or redirect to login page
    }
    if (error.response) {
      // Server responded with an error status
      showError(`${message}: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      showError(`${message}: Network error - No response from server`);
    } else {
      // Something else happened
      showError(`${message}: ${error.message}`);
    }
  } else {
    // Not an axios error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showError(`${message}: ${errorMessage}`);
  }
  
  throw error;
};

// API functions
export const createTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  try {
    const response = await apiClient.post<Transaction>('/transactions', transaction);
    showSuccess('Transaction created successfully!');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create transaction');
  }
};

export const updateTransactionState = async (id: string, state: string): Promise<void> => {
  try {
    await apiClient.put(`/transactions/${id}/state/${state}`);
    showSuccess(`Transaction status updated to ${state}`);
  } catch (error) {
    handleApiError(error, `Failed to update transaction state to ${state}`);
  }
};

// ... rest of your API functions ... 