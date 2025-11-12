// src/App.tsx (Fixed IFC to Viewer Connection)

import { useState, useEffect } from 'react';
import Header from './pages/main-layout-components/Header.tsx';
import Footer from './pages/main-layout-components/Footer.tsx';

// Import Page components
import ProjectSelection from './pages/project-selection/ProjectSelection.tsx';
import Stats from './pages/stats/Stats';

// Import Viewer components
import { ViewerProvider, useViewer } from './components/3d-view-components/ViewerContext.tsx';
import BIMViewer from './pages/main-layout-components/BimViewer.tsx';
import ViewerToolbar from './components/3d-view-components/BimViewerSettings/ViewerToolbar.tsx';
import ToolsPanel from './components/3d-view-components/ToolsPanel/ToolsPanel.tsx';

import './App.css';

// --- !! CORRECTED: This is the original loader for .frag files !! ---
const ViewerLoader = ({ file }: { file: File | null }) => {
    const { loadIfcModel } = useViewer(); // Use loadIfcModel instead of loadFragModel

    useEffect(() => {
        if (file && loadIfcModel) {
            console.log('ViewerLoader: Loading IFC file directly...', file.name);
            // Check if it's an IFC file
            if (file.name.toLowerCase().endsWith('.ifc')) {
                loadIfcModel(file).catch(console.error);
            } else {
                console.warn('Unsupported file type:', file.name);
            }
        }
    }, [file, loadIfcModel]);

    return null;
};

function App() {
    const [activeView, setActiveView] = useState('project');
    const [importedFiles, setImportedFiles] = useState<File[]>([]);
    const [fileToLoad, setFileToLoad] = useState<File | null>(null);

    const handleViewChange = (view: string) => {
        setActiveView(view);
    };

    // Modified to handle IFC files directly
    const handleLoadProject = (ifcFile: File) => {
        console.log('App: Received IFC file to load:', ifcFile.name);
        console.log('App: Switching to viewer and loading IFC model directly...');

        // Set the IFC file
        setFileToLoad(ifcFile);

        // Switch to viewer view
        setTimeout(() => {
            setActiveView('viewer');
        }, 100);
    };

    // Helper style function
    const getViewStyle = (viewName: string): React.CSSProperties => ({
        display: activeView === viewName ? 'block' : 'none',
        height: '100%',
        width: '100%',
        overflow: 'auto'
    });

    return (
        <div className="App">
            <Header activeView={activeView} onViewChange={handleViewChange} />

            <main className="app-content">
                {/* View 1: Project Selection */}
                <div style={getViewStyle('project')}>
                    <ProjectSelection
                        onLoadProject={handleLoadProject}
                        importedFiles={importedFiles}
                        onImportedFilesChange={setImportedFiles}
                    />
                </div>

                {/* View 2: 3D Viewer */}
                <div style={getViewStyle('viewer')}>
                    <ViewerProvider>
                        {/* Pass the IFC file to the loader */}
                        <ViewerLoader file={fileToLoad} />
                        <div className="viewer-ui-container">
                            <ToolsPanel />
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