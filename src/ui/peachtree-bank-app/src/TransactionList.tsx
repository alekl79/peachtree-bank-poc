import React, { useState } from 'react';
import { Box, Typography, Table } from '@mui/joy';
import { apiClient } from '../services/apiClient';
import { handleApiError } from '../utils/handleApiError';
import Pagination from '@mui/material/Pagination';

interface TransactionResponse {
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

interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  created: string;
  state: string;
  lastStateUpdate: string;
  version: number;
}

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

    const emptyResponse: TransactionResponse = {
      data: [],
      currentPage: page,
      totalPages: 0,
      pageSize: pageSize,
      activeFilters: {
        q,
        sortBy,
        sortDirection
      }
    };

    if (response.status === 204) {
      return emptyResponse;
    }

    return response.data ?? emptyResponse;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch transactions');
  }
};

export const TransactionList = () => {
  const [transactions, setTransactions] = useState<TransactionResponse>({
    data: [],
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    activeFilters: {
      q: '',
      sortBy: 'created',
      sortDirection: 'desc'
    }
  });

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    // Your page change logic here
  };

  const transactionData = transactions?.data ?? [];
  const hasTransactions = transactionData.length > 0;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {!hasTransactions ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 4,
            minHeight: '200px'
          }}
        >
          <Typography level="body-lg">
            No transactions found
          </Typography>
        </Box>
      ) : (
        <>
          <Table>
            {transactionData.map((transaction) => (
              // Your table row rendering
            ))}
          </Table>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={transactions?.totalPages ?? 0}
              page={transactions?.currentPage ?? 1}
              onChange={handlePageChange}
              disabled={!hasTransactions}
            />
          </Box>
        </>
      )}
    </Box>
  );
}; 