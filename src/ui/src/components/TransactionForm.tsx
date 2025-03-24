// src/components/TransactionForm.tsx
import React, { useState } from 'react';
import { createTransaction, Transaction } from '../api';
import { Box, Card, CardContent, Typography, Button, Stack, Input } from '@mui/joy';

interface TransactionFormProps {
  onCreated: (tx: Transaction) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onCreated }) => {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTx = await createTransaction({ fromAccount, toAccount, amount });
      onCreated(newTx);
      setFromAccount('');
      setToAccount('');
      setAmount(0);
    } catch (error) {
      console.error('Error creating transaction', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 600, margin: 'auto', mt: 3 }}>
      <CardContent>
        <Typography level="h4" mb={2}>Create Transaction</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography level="body-sm" fontWeight="bold">FROM ACCOUNT</Typography>
            <Input
              placeholder="Select account"
              value={fromAccount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromAccount(e.target.value)}
              required
            />
            
            <Typography level="body-sm" fontWeight="bold">TO ACCOUNT</Typography>
            <Input
              placeholder="Select recipient"
              value={toAccount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToAccount(e.target.value)}
              required
            />
            
            <Typography level="body-sm" fontWeight="bold">AMOUNT</Typography>
            <Input
              placeholder="$0.00"
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(parseFloat(e.target.value))}
              required
              startDecorator="$"
            />
            
            <Button 
              type="submit" 
              disabled={loading} 
              variant="solid" 
              color="warning"
              sx={{ mt: 2, bgcolor: '#f37e4c' }}
            >
              {loading ? 'Processing...' : 'SUBMIT'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
