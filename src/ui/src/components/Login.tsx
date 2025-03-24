import React, { useState } from 'react';
import { Box, Card, Typography, Input, Button, FormControl, FormLabel } from '@mui/joy';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Failed to log in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', p: 3 }}>
        <Typography level="h4" component="h1" sx={{ mb: 3 }}>
          Login to Peachtree Bank
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormControl>
          <FormControl sx={{ mb: 3 }}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormControl>
          <Button 
            type="submit" 
            loading={loading}
            fullWidth
          >
            Login
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default Login; 