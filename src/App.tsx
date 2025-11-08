// src/App.tsx
import React from 'react';
// ✅ Add these imports
import { useViewer, ViewerProvider } from './components/ViewerContext';
import BIMViewer from './components/BimViewer';
import ModelsPanel from './components/ModelsPanel';
import ViewerToolbar from './components/ViewerToolbar';
import ViewportSettings from './components/ViewportSettings';
import MeasurementTools from './components/MeasurementTools';
import './App.css';

const AppContent: React.FC = () => {
    // This is correct
    const { isReady } = useViewer();

    return (
        <div className="app">
            <div className="content-grid">
                {isReady && <ModelsPanel />}

                <div className="viewport-container">
                    <BIMViewer />

                    {isReady && (
                        <>
                            <ViewportSettings />
                            <MeasurementTools />
                            <ViewerToolbar />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    // This is correct
    return (
        <ViewerProvider>
            <AppContent />
        </ViewerProvider>
    );
};

export default App;