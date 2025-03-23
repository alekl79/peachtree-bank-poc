// src/components/TransactionDetails.tsx
import React from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/joy';
import { Transaction } from '../api';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction, onClose }) => {
  return (
    <Card variant="outlined" sx={{ maxWidth: 600, margin: 'auto' }}>
      <CardContent>
        <Typography level="title-lg" mb={2}>Transaction Details</Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography level="body-sm" fontWeight="bold">ID</Typography>
            <Typography level="body-md">{transaction.id}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">FROM</Typography>
            <Typography level="body-md">{transaction.fromAccount}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">TO</Typography>
            <Typography level="body-md">{transaction.toAccount}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">AMOUNT</Typography>
            <Typography level="body-md">${transaction.amount.toFixed(2)}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">DATE</Typography>
            <Typography level="body-md">{new Date(transaction.created).toLocaleString()}</Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" fontWeight="bold">STATUS</Typography>
            <Typography level="body-md">{transaction.state}</Typography>
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
