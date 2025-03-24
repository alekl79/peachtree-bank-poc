// src/components/TransactionList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Transaction, fetchTransactions } from '../api';
import { Box, Typography, Button, Stack, Divider, Input, Select, Option, IconButton, Tooltip } from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';

interface TransactionListProps {
  onSelect: (transaction: Transaction) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: string;
  onSortFieldChange: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

// Define sort options mapping
interface SortOption {
  field: string;
  label: string;
}

const sortOptions: Record<string, SortOption> = {
  created: { field: 'created', label: 'DATE' },
  toAccount: { field: 'toAccount', label: 'BENEFICIARY' },
  amount: { field: 'amount', label: 'AMOUNT' }
};

const getStateColor = (state: string) => {
  switch (state) {
    case 'Send':
      return '#2196F3'; // Blue
    case 'Received':
      return '#4CAF50'; // Green
    case 'Paid':
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Grey
  }
};

const PAGE_SIZE = 10;

const TransactionList: React.FC<TransactionListProps> = ({ 
  onSelect, 
  currentPage, 
  onPageChange,
  searchQuery,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchTransactions(
        searchQuery,
        currentPage,
        PAGE_SIZE,
        sortField,
        sortOrder
      );
      
      setTransactions(response.data);
      setTotalCount(response.totalPages * response.pageSize);
    } catch (error) {
      console.error('Error fetching transactions', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, sortField, sortOrder]);
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 500); // 500ms delay after typing stops
    
    return () => clearTimeout(timer);
  }, [loadTransactions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSortFieldChange = (value: string | null) => {
    if (value) {
      onSortFieldChange(value);
    }
  };

  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (_event: React.MouseEvent | null, newPage: number) => {
    onPageChange(newPage);
  };

  const handleResetFilters = () => {
    onSearchChange('');
    onSortFieldChange('created');
    onSortOrderChange('desc');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and sort controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '60%' }}>
          <Input 
            placeholder="Search by typing..." 
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1 }}
          />
          {(searchQuery || sortField !== 'created' || sortOrder !== 'desc') && (
            <Tooltip title="Reset filters" placement="right">
              <IconButton
                variant="plain"
                color="neutral"
                onClick={handleResetFilters}
                sx={{ ml: 1 }}
                size="sm"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography level="body-sm" sx={{ mr: 1 }}>Sort by</Typography>
          <Select 
            value={sortField} 
            onChange={(_, value) => handleSortFieldChange(value)} 
            size="sm"
            sx={{ mr: 1 }}
          >
            {Object.entries(sortOptions).map(([key, option]) => (
              <Option key={key} value={key}>{option.label}</Option>
            ))}
          </Select>
          
          <Button 
            variant="outlined" 
            size="sm" 
            onClick={toggleSortOrder}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </Box>
      </Box>
      
      {/* Loading indicator */}
      {loading && transactions.length === 0 && (
        <Box sx={{ p: 2 }}>
          <Typography level="body-md">Loading transactions…</Typography>
        </Box>
      )}
      
      {/* Transaction list with fixed height */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          minHeight: '400px', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Empty state */}
        {!loading && transactions.length === 0 && (
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            borderRadius: 1,
            bgcolor: 'background.level1'
          }}>
            <Typography level="body-md">No transactions found</Typography>
          </Box>
        )}
        
        {/* Transaction items in scrollable container */}
        {transactions.length > 0 && (
          <Stack 
            spacing={0} 
            divider={<Divider />} 
            sx={{ 
              overflowY: 'auto',
              flexGrow: 1,
              // Add subtle scrollbar styling
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'background.level1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'neutral.400',
                borderRadius: '4px',
              },
            }}
          >
            {loading && <Box sx={{ p: 2 }}><Typography level="body-sm">Searching...</Typography></Box>}
            
            {transactions.map((tx) => (
              <Box 
                key={tx.id} 
                sx={{ 
                  display: 'flex', 
                  p: 1.5, 
                  borderLeft: `4px solid ${getStateColor(tx.state)}`,
                  '&:hover': { bgcolor: 'background.level1', cursor: 'pointer' }
                }}
                onClick={() => onSelect(tx)}
              >
                <Box sx={{ width: '15%' }}>
                  <Tooltip 
                    title={new Date(tx.created).toLocaleString('en-US', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                    placement="top"
                  >
                    <Typography level="body-sm">
                      {new Date(tx.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Tooltip>
                </Box>
                <Box sx={{ width: '15%', display: 'flex', justifyContent: 'center' }}>
                  {/* Icon placeholder */}
                  <Box sx={{ width: 30, height: 30, bgcolor: 'neutral.300', borderRadius: '50%' }} />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <Typography level="body-md">{tx.toAccount}</Typography>
                  <Typography level="body-xs" sx={{ color: getStateColor(tx.state) }}>
                    {tx.state}
                  </Typography>
                </Box>
                <Box sx={{ width: '20%', textAlign: 'right' }}>
                  <Typography 
                    level="body-md" 
                    sx={{ 
                      color: tx.amount < 0 ? 'danger.500' : 'success.500'
                    }}
                  >
                    {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3,
          pt: 2,
          pb: 2,
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="plain" 
              disabled={currentPage === 1} 
              onClick={() => handlePageChange(null, currentPage - 1)}
              sx={{ minWidth: 'auto' }}
            >
              Previous
            </Button>
            
            <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
              <Typography level="body-sm">
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
            
            <Button 
              variant="plain" 
              disabled={currentPage === totalPages} 
              onClick={() => handlePageChange(null, currentPage + 1)}
              sx={{ minWidth: 'auto' }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TransactionList;
