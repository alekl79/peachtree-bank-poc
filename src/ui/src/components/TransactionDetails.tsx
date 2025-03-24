// src/components/TransactionDetails.tsx
import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Select, Option } from '@mui/joy';
import { Transaction, updateTransactionState, fetchTransactionById } from '../api';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
  onStatusChange?: () => void;
}

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

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction, onClose, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentState, setCurrentState] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState(transaction);

  useEffect(() => {
    setCurrentState(currentTransaction.state);
  }, [currentTransaction.state]);

  const refreshTransaction = async () => {
    try {
      const updatedTransaction = await fetchTransactionById(transaction.id);
      setCurrentTransaction(updatedTransaction);
    } catch (error) {
      console.error('Failed to refresh transaction:', error);
    }
  };

  const handleStatusChange = async (_: React.SyntheticEvent | null, newValue: string | null) => {
    if (!newValue || newValue === currentState) return;
    
    setIsUpdating(true);
    try {
      await updateTransactionState(transaction.id, newValue);
      await refreshTransaction();
      setCurrentState(newValue);
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        maxWidth: 600, 
        margin: 'auto',
        borderLeft: `4px solid ${getStateColor(currentState)}`
      }}
    >
      <CardContent>
        <Typography level="title-lg" mb={2}>Transaction Details</Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography level="body-sm" fontWeight="bold">ID</Typography>
            <Typography level="body-md">{currentTransaction.id}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">FROM</Typography>
            <Typography level="body-md">{currentTransaction.fromAccount}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">TO</Typography>
            <Typography level="body-md">{currentTransaction.toAccount}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">AMOUNT</Typography>
            <Typography level="body-md">${currentTransaction.amount.toFixed(2)}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">DATE</Typography>
            <Typography level="body-md">{new Date(currentTransaction.created).toLocaleString()}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">STATUS</Typography>
            <Select
              value={currentState}
              onChange={handleStatusChange}
              disabled={isUpdating}
              size="sm"
              sx={{ 
                minWidth: 120,
                '& .MuiSelect-select': {
                  color: getStateColor(currentState)
                }
              }}
            >
              <Option value="Send" sx={{ color: '#2196F3' }}>Send</Option>
              <Option value="Received" sx={{ color: '#4CAF50' }}>Received</Option>
              <Option value="Paid" sx={{ color: '#9C27B0' }}>Paid</Option>
            </Select>
          </Box>
          
          <Button onClick={onClose} variant="outlined" sx={{ mt: 2 }}>
            Close
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionDetails;
