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

// 3. Utility component to load the model
// This component lives inside ViewerProvider, so it can use the context.
const ViewerLoader = ({ file }: { file: File | null }) => {
    // Use the new loadFragModel function
    const { loadFragModel } = useViewer();

    useEffect(() => {
        if (file && loadFragModel) {
            console.log('ViewerLoader: Loading frag file...');
            loadFragModel(file).catch(console.error);
        }
    }, [file, loadFragModel]); // Runs when file or function is ready

    return null; // This component renders nothing
};


function App() {
    const [activeView, setActiveView] = useState('project');

    // 4. App component now "owns" this state
    const [importedFiles, setImportedFiles] = useState<File[]>([]);
    const [fileToLoad, setFileToLoad] = useState<File | null>(null);

    const handleViewChange = (view: string) => {
        setActiveView(view);
    };

    // 5. This function is passed to ProjectSelection
    // It just sets the state and changes the view.
    // The actual loading is handled by <ViewerLoader>
    const handleLoadProject = (fragFile: File) => {
        console.log('App: Setting file to load and switching to viewer...');
        setFileToLoad(fragFile); // Set the file
        setActiveView('viewer');  // Change the view
    };

    return (
        <div className="App">
            <Header activeView={activeView} onViewChange={handleViewChange} />

            {/* The <main> element is now just a container.
          The page components will control their own layout. */}
            <main className="app-content">

                {/* View 1: Project Selection */}
                {activeView === 'project' && (
                    <ProjectSelection
                        onViewChange={handleViewChange}
                        onLoadProject={handleLoadProject}
                        importedFiles={importedFiles}
                        onImportedFilesChange={setImportedFiles}
                    />
                )}

                {/* View 2: 3D Viewer */}
                {activeView === 'viewer' && (
                    <ViewerProvider>
                        {/* Pass the file to the loader */}
                        <ViewerLoader file={fileToLoad} />

                        <div className="viewer-ui-container">
                            <ModelsPanel />
                            <ViewerToolbar />
                            <BIMViewer />
                        </div>
                    </ViewerProvider>
                )}

                {/* View 3: Statistics */}
                {activeView === 'stats' && (
                    <Stats />
                )}

            </main>

            <Footer />
        </div>
    );
}

export default App;