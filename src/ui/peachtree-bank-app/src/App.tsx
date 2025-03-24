import React from 'react';
import { useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext';
import { initializeSnackbar } from './api';

function AppContent() {
  const { showError, showSuccess } = useSnackbar();

  useEffect(() => {
    initializeSnackbar(showError, showSuccess);
  }, [showError, showSuccess]);

  return (
    // Your existing app content here
    <div>
      {/* Your routes and components */}
    </div>
  );
}

function App() {
  return (
    <SnackbarProvider>
      <AppContent />
    </SnackbarProvider>
  );
}

export default App; 