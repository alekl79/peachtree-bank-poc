import React, { createContext, useContext, useState } from 'react';
import { Snackbar } from '@mui/joy';

interface SnackbarContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [color, setColor] = useState<'success' | 'danger'>('success');

  const showMessage = (message: string, color: 'success' | 'danger') => {
    setMessage(message);
    setColor(color);
    setOpen(true);
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSuccess: (message) => showMessage(message, 'success'),
        showError: (message) => showMessage(message, 'danger'),
      }}
    >
      {children}
      <Snackbar
        variant="solid"
        color={color}
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={3000}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}; 