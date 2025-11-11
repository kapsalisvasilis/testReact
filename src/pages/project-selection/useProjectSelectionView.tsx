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

interface ProjectDetails {
    responseCode: string;
    responseDescription: string;
    projectUUID: string;
    projectName: string;
    description: string;
    projectStatus: string;
    siteList: Array<{
        siteUuid: string;
        name: string;
        longitude: number;
        latitude: number;
        buildingList: Array<{
            buildingUuid: string;
            name: string;
            hrefIfc: string;
        }>;
    }>;
}

interface UseProjectSelectionProps {
    onLoadProject: (file: File) => void;
    importedFiles: File[];
    onImportedFilesChange: (files: File[]) => void;
}

export const useProjectSelection = ({ onLoadProject, importedFiles, onImportedFilesChange }: UseProjectSelectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States for loading
    const [isLoading, setIsLoading] = useState(false);
    const [loadingFile, setLoadingFile] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // States for API projects
    const [availableProjects, setAvailableProjects] = useState<ApiProject[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    // Backend message state - set default message
    const [backendMessage, setBackendMessage] = useState<string>('Ready to load projects');

    // Fetch available projects from API
    useEffect(() => {
        const fetchAvailableProjects = async () => {
            setLoadingProjects(true);
            setProjectsError(null);

            try {
                const response = await fetch('/api/bim/getAllProjects');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.responseCode === 'SUCCESS') {
                    setAvailableProjects(data.projectList);
                    setBackendMessage(`Found ${data.projectList.length} projects`);
                } else {
                    throw new Error(data.responseDescription || 'Failed to load projects');
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                const errorMsg = err instanceof Error ? err.message : String(err);
                setProjectsError(`Failed to load available projects: ${errorMsg}`);
                setBackendMessage('Error loading projects');
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchAvailableProjects();
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

    // Direct IFC file loading for local files
    const handleProjectSelect = async (ifcFile: File) => {
        console.log(`Loading IFC file directly: ${ifcFile.name}...`);

        setIsLoading(true);
        setLoadError(null);
        setLoadingFile(ifcFile.name);

        try {
            console.log(`Passing IFC file to viewer: ${ifcFile.name}`);
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

    // Load API project and fetch IFC file through CORS proxy
    const handleLoadApiProject = async (project: ApiProject) => {
        console.log(`Loading API project: ${project.projectName}`);

        setIsLoading(true);
        setLoadError(null);
        setLoadingFile(project.projectName);

        // Declare ifcUrl outside the try block so it's available in catch
        let ifcUrl: string | null = null;

        try {
            // Step 1: Get project details
            const projectResponse = await fetch(`/api/bim/getProject/${project.projectUUID}`);

            if (!projectResponse.ok) {
                throw new Error(`Failed to fetch project details: ${projectResponse.status}`);
            }

            const projectData: ProjectDetails = await projectResponse.json();

            if (projectData.responseCode !== 'SUCCESS') {
                throw new Error(projectData.responseDescription || 'Failed to load project details');
            }

            // Step 2: Get the first building's IFC URL
            const firstSite = projectData.siteList[0];
            if (!firstSite || !firstSite.buildingList || firstSite.buildingList.length === 0) {
                throw new Error('No buildings found in this project');
            }

            const firstBuilding = firstSite.buildingList[0];
            ifcUrl = firstBuilding.hrefIfc;

            console.log(`Fetching IFC from: ${ifcUrl}`);

            // Step 3: CORS proxy function
            const fetchWithCorsProxy = async (url: string) => {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                try {
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response;
                } catch (error) {
                    // Fallback proxy
                    const fallbackProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                    const response = await fetch(fallbackProxy);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response;
                }
            };

            // Download the IFC file using CORS proxy
            const ifcResponse = await fetchWithCorsProxy(ifcUrl);

            if (!ifcResponse.ok) {
                throw new Error(`Failed to download IFC file: ${ifcResponse.status}`);
            }

            const ifcBlob = await ifcResponse.blob();
            const ifcFile = new File([ifcBlob], `${project.projectName}.ifc`, {
                type: 'application/octet-stream',
            });

            console.log(`API project loaded. Loading: ${ifcFile.name}`);
            onLoadProject(ifcFile);

        } catch (err) {
            console.error('API project load error:', err);
            const errorMsg = err instanceof Error ? err.message : String(err);

            // Now ifcUrl is available in the catch block
            const errorMessage = ifcUrl
                ? `Failed to load ${project.projectName} from ${ifcUrl}: ${errorMsg}`
                : `Failed to load ${project.projectName}: ${errorMsg}`;

            setLoadError(errorMessage);
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
        availableProjects,
        loadingProjects,
        projectsError,
        backendMessage,

        // Handlers
        handleCreateNew,
        handleLoadClick,
        handleFileChange,
        handleProjectSelect,
        handleLoadApiProject,
    };
};