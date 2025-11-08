import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 1. Import Mantine provider and styles
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/*
      2. Wrap your entire App in the MantineProvider.
         Your app is clearly dark-themed, so we set 'dark' as the default.
    */}
        <MantineProvider
            theme={{ colorScheme: 'dark' }}
            withGlobalStyles
            withCssVariables
        >
            <App />
        </MantineProvider>
    </React.StrictMode>
);