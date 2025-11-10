// hooks/useProjectSelectionView.tsx
import { useState, useEffect, useRef } from 'react';

export interface ApiProject {
    projectUUID: string;
    projectName: string;
    description: string;
    thumbnail: string;
    status: string;
    createdAt: number;
}

interface UseProjectSelectionProps {
    onLoadProject: (file: File) => void;
    importedFiles: File[];
    onImportedFilesChange: (files: File[]) => void;
}

export const useProjectSelection = ({ onLoadProject, importedFiles, onImportedFilesChange }: UseProjectSelectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simplified states for direct IFC loading
    const [isLoading, setIsLoading] = useState(false);
    const [loadingFile, setLoadingFile] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Backend message state
    const [backendMessage, setBackendMessage] = useState<string>('');

    // Fetch backend message (optional - you can remove this if not needed)
    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await fetch('/api/message');
                const data = await response.json();
                setBackendMessage(data.message);
            } catch (error) {
                console.error('Failed to fetch from backend:', error);
                setBackendMessage('Ready to load IFC files directly');
            }
        };
        fetchMessage();
    }, []);

    // Handlers
    const handleCreateNew = () => {
        console.log("Create New Project clicked");
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const existingNames = new Set(importedFiles.map(f => f.name));
            const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
            onImportedFilesChange([...importedFiles, ...uniqueNewFiles]);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    // Direct IFC file loading
    const handleProjectSelect = async (ifcFile: File) => {
        console.log(`Loading IFC file directly: ${ifcFile.name}...`);

        setIsLoading(true);
        setLoadError(null);
        setLoadingFile(ifcFile.name);

        try {
            console.log(`Passing IFC file to viewer: ${ifcFile.name}`);
            // Pass the original IFC file directly to the viewer
            onLoadProject(ifcFile);
        } catch (err) {
            console.error('IFC load error:', err);
            const errorMsg = err instanceof Error ? err.message : String(err);
            setLoadError(`Failed to load ${ifcFile.name}: ${errorMsg}`);
        } finally {
            setIsLoading(false);
            setLoadingFile(null);
        }
    };

    return {
        // Refs
        fileInputRef,

        // State
        isLoading,
        loadError,
        loadingFile,
        backendMessage,

        // Handlers
        handleCreateNew,
        handleLoadClick,
        handleFileChange,
        handleProjectSelect,
    };
};