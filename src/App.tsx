// src/App.tsx (Updated)

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

// 1. Import Page components
import ProjectSelection from './pages/project-selection/ProjectSelection';
import Stats from './pages/stats/Stats';

// 2. Import Viewer components
import { ViewerProvider, useViewer } from './components/ViewerContext';
import BIMViewer from './components/BimViewer';
import ViewerToolbar from './components/ViewerToolbar';
import ModelsPanel from './components/ModelsPanel';

import './App.css';

// Utility component to load the model (No changes)
const ViewerLoader = ({ file }: { file: File | null }) => {
    const { loadFragModel } = useViewer();
    useEffect(() => {
        if (file && loadFragModel) {
            console.log('ViewerLoader: Loading frag file...');
            loadFragModel(file).catch(console.error);
        }
    }, [file, loadFragModel]);
    return null;
};


function App() {
    const [activeView, setActiveView] = useState('project');
    const [importedFiles, setImportedFiles] = useState<File[]>([]);
    const [fileToLoad, setFileToLoad] = useState<File | null>(null);

    const handleViewChange = (view: string) => {
        setActiveView(view);
    };

    const handleLoadProject = (fragFile: File) => {
        console.log('App: Setting file to load and switching to viewer...');
        setFileToLoad(fragFile);
        setActiveView('viewer');
    };

    // --- HELPER STYLE FUNCTION ---
    // This creates the style to hide/show a view
    const getViewStyle = (viewName: string): React.CSSProperties => ({
        display: activeView === viewName ? 'block' : 'none',
        // Make the div fill the <main> container
        height: '100%',
        width: '100%',
        overflow: 'auto'
    });

    return (
        <div className="App">
            <Header activeView={activeView} onViewChange={handleViewChange} />

            <main className="app-content">

                {/* --- FIX: All views are now mounted, but hidden with CSS --- */}

                {/* View 1: Project Selection */}
                <div style={getViewStyle('project')}>
                    <ProjectSelection
                        onViewChange={handleViewChange}
                        onLoadProject={handleLoadProject}
                        importedFiles={importedFiles}
                        onImportedFilesChange={setImportedFiles}
                    />
                </div>

                {/* View 2: 3D Viewer */}
                <div style={getViewStyle('viewer')}>
                    {/* The ViewerProvider is now persistent */}
                    <ViewerProvider>
                        <ViewerLoader file={fileToLoad} />
                        <div className="viewer-ui-container">
                            <ModelsPanel />
                            <ViewerToolbar />
                            <BIMViewer />
                        </div>
                    </ViewerProvider>
                </div>

                {/* View 3: Statistics */}
                <div style={getViewStyle('stats')}>
                    <Stats />
                </div>

            </main>

            <Footer />
        </div>
    );
}

export default App;