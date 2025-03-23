// src/components/TransactionList.tsx
import React, { useEffect, useState } from 'react';
import { Transaction, fetchTransactions } from '../api';
import { Box, Card, CardContent, Typography, Button, Stack, Divider, Input, Select, Option, IconButton } from '@mui/joy';

interface TransactionListProps {
  onSelect: (transaction: Transaction) => void;
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

const PAGE_SIZE = 10;

const TransactionList: React.FC<TransactionListProps> = ({ onSelect }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 500); // 500ms delay after typing stops
    
    return () => clearTimeout(timer);
  }, [searchQuery, sortField, sortOrder, page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetchTransactions(
        searchQuery,
        page,
        PAGE_SIZE,
        sortField,
        sortOrder
      );
      
      setTransactions(response.data);
      setPage(response.currentPage);
      setTotalCount(response.totalPages * response.pageSize);
    } catch (error) {
      console.error('Error fetching transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSortFieldChange = (value: string | null) => {
    if (value) {
      setSortField(value);
      setPage(1); // Reset to first page on sort change
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (_event: React.MouseEvent | null, newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and sort controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Input 
          placeholder="Search by typing..." 
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: '60%' }} 
        />
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
                  borderLeft: '4px solid', 
                  borderLeftColor: 'primary.main',
                  '&:hover': { bgcolor: 'background.level1', cursor: 'pointer' }
                }}
                onClick={() => onSelect(tx)}
              >
                <Box sx={{ width: '15%' }}>
                  <Typography level="body-sm">{new Date(tx.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Typography>
                </Box>
                <Box sx={{ width: '15%', display: 'flex', justifyContent: 'center' }}>
                  {/* Icon placeholder */}
                  <Box sx={{ width: 30, height: 30, bgcolor: 'neutral.300', borderRadius: '50%' }} />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <Typography level="body-md">{tx.toAccount}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    {tx.state === 'completed' ? 'Card Payment' : 'Transaction'}
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
              disabled={page === 1} 
              onClick={() => handlePageChange(null, page - 1)}
              sx={{ minWidth: 'auto' }}
            >
              Previous
            </Button>
            
            <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
              <Typography level="body-sm">
                Page {page} of {totalPages}
              </Typography>
            </Box>
            
            <Button 
              variant="plain" 
              disabled={page === totalPages} 
              onClick={() => handlePageChange(null, page + 1)}
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
