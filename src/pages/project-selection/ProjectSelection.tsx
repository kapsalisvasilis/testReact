// ProjectSelection.tsx (Main Component)
import React from 'react';
import { ProjectSelectionView } from './ProjectSelectionView';
import { useProjectSelection } from './useProjectSelectionView';

interface ProjectSelectionProps {
    onLoadProject: (file: File) => void;
    importedFiles: File[];
    onImportedFilesChange: (files: File[]) => void;
}

const ProjectSelection: React.FC<ProjectSelectionProps> = ({
                                                               onLoadProject,
                                                               importedFiles,
                                                               onImportedFilesChange
                                                           }) => {
    const {
        fileInputRef,
        isLoading,
        loadError,
        loadingFile,
        backendMessage,
        handleCreateNew,
        handleLoadClick,
        handleFileChange,
        handleProjectSelect,
    } = useProjectSelection({
        onLoadProject,
        importedFiles,
        onImportedFilesChange,
    });

    return (
        <ProjectSelectionView
            fileInputRef={fileInputRef}
            isLoading={isLoading}
            loadError={loadError}
            loadingFile={loadingFile}
            backendMessage={backendMessage}
            importedFiles={importedFiles}
            onCreateNew={handleCreateNew}
            onLoadClick={handleLoadClick}
            onFileChange={handleFileChange}
            onProjectSelect={handleProjectSelect}
        />
    );
};

export default ProjectSelection;