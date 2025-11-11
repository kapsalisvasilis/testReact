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
        availableProjects,
        loadingProjects,
        projectsError,
        backendMessage,
        handleCreateNew,
        handleLoadClick,
        handleFileChange,
        handleProjectSelect,
        handleLoadApiProject,
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
            availableProjects={availableProjects}
            loadingProjects={loadingProjects}
            projectsError={projectsError}
            backendMessage={backendMessage}
            importedFiles={importedFiles}
            onCreateNew={handleCreateNew}
            onLoadClick={handleLoadClick}
            onFileChange={handleFileChange}
            onProjectSelect={handleProjectSelect}
            onLoadApiProject={handleLoadApiProject}
        />
    );
};

export default ProjectSelection;