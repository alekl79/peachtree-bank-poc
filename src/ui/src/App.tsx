// src/App.tsx
import React, { useState } from 'react';
import { CssBaseline, Box, Container, Grid, Typography, GlobalStyles } from '@mui/joy';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import TransactionDetails from './components/TransactionDetails';
import { Transaction } from './api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';

// Background image URL
const backgroundImageUrl = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop';

// Separate the main content into a new component
function MainContent() {
  const { currentUser } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleTransactionCreated = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedTransaction(null);
  };

  const handleStatusChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleSortFieldChange = (field: string) => {
    setSortField(field);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page on sort change
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        p: { xs: 2, md: 4 },
        my: 2
      }}
    >
      {/* Logo and title */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        mb: 4
      }}>
        <Box 
          component="img" 
          src="/peach-icon.webp" 
          alt="Peachtree Bank Logo" 
          sx={{ 
            width: 50, 
            height: 50, 
            mr: 2,
            filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2))'
          }} 
        />
        <Typography 
          level="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.800',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          Peachtree Bank
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left column - Transaction Form */}
        <Grid xs={12} md={5}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 2, 
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography level="title-lg">Make a Transfer</Typography>
          </Box>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 4
          }}>
            <TransactionForm onCreated={handleTransactionCreated} />
          </Box>
        </Grid>
        
        {/* Right column - Transaction List or Details */}
        <Grid xs={12} md={7}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 2, 
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography level="title-lg">
              {selectedTransaction ? 'Transaction Details' : 'Recent Transactions'}
            </Typography>
          </Box>
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            borderRadius: '0 0 8px 8px',
            minHeight: '500px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 4,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {!selectedTransaction ? (
              <TransactionList 
                key={refreshKey} 
                onSelect={setSelectedTransaction}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortField={sortField}
                onSortFieldChange={handleSortFieldChange}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderChange}
              />
            ) : (
              <TransactionDetails 
                transaction={selectedTransaction} 
                onClose={() => setSelectedTransaction(null)}
                onStatusChange={handleStatusChange}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            padding: '10px 0',
          },
        }}
      />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ opacity: 0.5 }}
        toastStyle={{ opacity: 0.5 }}
      />
      <MainContent />
    </AuthProvider>
  );
}

export default App;
