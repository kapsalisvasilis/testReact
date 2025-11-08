import {
    Card,
    Text,
    Title,
    SimpleGrid,
    ThemeIcon,
    Anchor,
    Group,
    ScrollArea,
    Box,
    useMantineTheme,
    rem,
    Button,
    Loader, // <-- IMPORT LOADER
} from '@mantine/core';
import { IconPlus, IconUpload, IconList, IconUser, Icon3dCubeSphere } from '@tabler/icons-react';
import {useEffect, useRef, useState} from 'react';

interface ProjectSelectionProps {
    onViewChange: (view: string) => void;
    // This prop will now be called with the converted .frag file
    onLoadProject: (file: File) => void;
    importedFiles: File[];
    onImportedFilesChange: (files: File[]) => void;
}

interface FeatureProps {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
}

const ProjectSelection = ({ onViewChange, onLoadProject, importedFiles = [], onImportedFilesChange }: ProjectSelectionProps) => {
    const theme = useMantineTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- NEW STATE for conversion ---
    const [isConverting, setIsConverting] = useState(false);
    const [conversionError, setConversionError] = useState<string | null>(null);
    const [convertingFile, setConvertingFile] = useState<string | null>(null); // Name of file being converted

    // --- Chart/Theme Colors (from Stats) ---
    const textColor = theme.colors.gray[1];
    const cardBg = theme.colors.dark[8];
    const accentColor = theme.colors.cyan[5];
    const accentColorLight = theme.colors.cyan[4];

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
// Inside your ProjectSelection component, add this state and effect:
    const [backendMessage, setBackendMessage] = useState<string>('');

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await fetch('/api/message');
                const data = await response.json();
                setBackendMessage(data.message);
                console.log('Backend response:', data);
            } catch (error) {
                console.error('Failed to fetch from backend:', error);
                setBackendMessage('❌ Could not connect to backend');
            }
        };

        fetchMessage();
    }, []);


    // --- MODIFIED handleProjectSelect ---
    // This now performs the conversion logic
    const handleProjectSelect = async (ifcFile: File) => {
        console.log(`Starting conversion for: ${ifcFile.name}...`);

        // 1. Set loading state
        setIsConverting(true);
        setConversionError(null);
        setConvertingFile(ifcFile.name);

        try {
            // 2. Create FormData
            const formData = new FormData();
            formData.append('ifcFile', ifcFile);

            // 3. Fetch from server
            const response = await fetch('/api/convert-ifc', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Server conversion failed');
            }

            // 4. Get Blob
            const fragBlob = await response.blob();

            // 5. Create new File object
            const fragFileName = ifcFile.name.endsWith('.ifc')
                ? ifcFile.name.replace('.ifc', '.frag')
                : `${ifcFile.name}.frag`;

            const newFragFile = new File([fragBlob], fragFileName, {
                type: 'application/octet-stream',
            });

            // 6. Call onLoadProject with the NEW .frag file
            console.log(`Conversion successful. Loading: ${newFragFile.name}`);
            onLoadProject(newFragFile);

        } catch (err) {
            console.error('Conversion error:', err);
            const errorMsg = err instanceof Error ? err.message : String(err);
            setConversionError(`Failed to convert ${ifcFile.name}: ${errorMsg}`);
        } finally {
            // 7. Reset loading state
            setIsConverting(false);
            setConvertingFile(null);
        }
    };

    const features: FeatureProps[] = [
        // ... FeatureCard definitions ...
        {
            icon: IconPlus,
            title: 'Create New Project',
            description: 'Start a new project from scratch. (Coming soon)',
            onClick: handleCreateNew,
        },
        {
            icon: IconUpload,
            title: 'Load Existing Project (IFC)',
            description: 'Load an .ifc file from your computer to get started.',
            onClick: handleLoadClick,
        },
    ];

    const FeatureCard = ({ icon: Icon, title, description, onClick }: FeatureProps) => (
        // ... FeatureCard JSX ...
        <Card
            shadow="md"
            radius="md"
            padding="xl"
            withBorder
            onClick={onClick}
            style={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                backgroundColor: cardBg, // <-- CHANGED
                border: `1px solid ${theme.colors.dark[5]}`, // <-- ADDED
            }}
            component="button"
            className="feature-card"
        >
            <style>
                {`
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: ${theme.shadows.lg};
                    border-color: ${theme.colors.dark[4]};
                }
                `}
            </style>
            <ThemeIcon variant="filled" size={60} radius={60} color="cyan"> {/* <-- CHANGED */}
                <Icon style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
            </ThemeIcon>
            <Text fz="lg" fw={500} mt="lg" c={textColor}> {/* <-- CHANGED */}
                {title}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
                {description}
            </Text>
        </Card>
    );

    // --- MODIFIED TocCard COMPONENT ---
    const TocCard = ({ title, icon: Icon, files, onFileDoubleClick, isConverting, convertingFile, conversionError }: {
        title: string,
        icon: React.ElementType,
        files: File[],
        onFileDoubleClick: (file: File) => void,
        // --- NEW PROPS ---
        isConverting: boolean,
        convertingFile: string | null,
        conversionError: string | null
    }) => {
        const [active, setActive] = useState<number | null>(null);
        // theme is already available from the outer component scope

        const linkHeight = rem(50);
        const itemMargin = rem(4);
        const indicatorHeight = rem(30);
        const indicatorOffset = `calc((${linkHeight} - ${indicatorHeight}) / 2)`;

        const handleItemLoad = (index: number, file: File) => {
            setActive(index);
            onFileDoubleClick(file); // This will now trigger the conversion
        };

        const items = files.map((file, index) => {
            // Check if this specific file is the one being converted
            const isFileConverting = isConverting && convertingFile === file.name;

            return (
                <Group
                    key={file.name}
                    justify="space-between"
                    className="toc-item-group"
                    data-active={active === index || undefined}
                    onClick={() => setActive(index)}
                    onDoubleClick={() => handleItemLoad(index, file)}
                    style={{
                        height: linkHeight,
                        marginBottom: itemMargin,
                        cursor: 'pointer',
                    }}
                >
                    <Anchor<'a'>
                        onDoubleClick={() => handleItemLoad(index, file)}
                        title={`Double-click to load ${file.name}`}
                        className="toc-item-anchor"
                        onClick={(e) => e.preventDefault()}
                        onMouseDown={(e) => e.preventDefault()}
                        style={{
                            flex: 1,
                            display: 'block',
                            textDecoration: 'none',
                        }}
                    >
                        {file.name}
                    </Anchor>

                    {/* --- DYNAMIC BUTTON/LOADER --- */}
                    {isFileConverting ? (
                        <Loader size="xs" color="cyan" />
                    ) : (
                        <Button
                            size="xs"
                            variant="light"
                            color="cyan" // <-- CHANGED
                            leftSection={<Icon3dCubeSphere size={14} />}
                            onClick={() => {
                                handleItemLoad(index, file);
                            }}
                            disabled={isConverting} // Disable all buttons while one is converting
                        >
                            3D View
                        </Button>
                    )}
                </Group>
            );
        });

        return (
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                    backgroundColor: cardBg, // <-- CHANGED
                    border: `1px solid ${theme.colors.dark[5]}` // <-- ADDED
                }}
            >
                <style>
                    {/* ... TocCard styles ... */}
                    {`
                    .links-wrapper {
                        position: relative;
                    }
                    
                    .link-indicator {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: ${rem(4)};
                        height: ${indicatorHeight};
                        background-color: ${accentColor}; /* <-- CHANGED */
                        border-radius: ${theme.radius.sm};
                        transition: transform 0.2s ease;
                        z-index: 1;
                    }

                    .toc-item-group {
                        padding: 0 ${rem(12)};
                        border-radius: ${theme.radius.sm};
                    }
                    
                    .toc-item-group:hover {
                        background-color: ${theme.colors.dark[7]}; /* <-- CHANGED */
                    }

                    .toc-item-group[data-active="true"] {
                        background-color: ${theme.colors.dark[6]}; /* <-- CHANGED */
                    }

                    .toc-item-anchor {
                        color: ${theme.colors.gray[4]}; /* <-- CHANGED */
                        font-size: ${theme.fontSizes.sm};
                        font-weight: 500;
                        padding: ${rem(4)} ${rem(8)};
                    }

                    .toc-item-group[data-active="true"] .toc-item-anchor {
                        color: ${accentColorLight}; /* <-- CHANGED */
                        font-weight: 600;
                    }
                    `}
                </style>

                <Group justify="space-between" mb="md">
                    <Title order={4} c={textColor} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}> {/* <-- CHANGED */}
                        <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                        {title}
                    </Title>
                </Group>
                <ScrollArea.Autosize mah={300}>
                    {files.length > 0 ? (
                        <Box className="links-wrapper">
                            <Box
                                className="link-indicator"
                                style={{
                                    display: active === null ? 'none' : 'block',
                                    transform: `translateY(calc(${active} * (${linkHeight} + ${itemMargin}) + ${indicatorOffset}))`,
                                }}
                            />
                            {items}
                        </Box>
                    ) : (
                        <Text c="dimmed" fz="sm" ta="center" p="md"> {/* <-- CHANGED */}
                            No projects found.
                        </Text>
                    )}
                </ScrollArea.Autosize>

                {/* --- NEW ERROR DISPLAY --- */}
                {title === "Imported Projects" && conversionError && (
                    <Text c="red" fz="sm" ta="center" p="xs" mt="sm">
                        {conversionError}
                    </Text>
                )}
            </Card>
        );
    };
    // --- END OF MODIFIED TocCard ---


    return (
        <Box
            style={{
                padding: '32px',
                height: '100%',
                backgroundColor: theme.colors.indigo[8], // <-- CHANGED
                overflow: 'auto',
            }}
        >
            <input
                type="file"
                accept=".ifc"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
            />

            <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <SimpleGrid cols={1} spacing="xl">
                        {features.map((feature) => (
                            <FeatureCard {...feature} key={feature.title} />
                        ))}
                    </SimpleGrid>

                    <SimpleGrid cols={1} spacing="xl">
                        <TocCard
                            title="Imported Projects"
                            icon={IconList}
                            files={importedFiles || []}
                            onFileDoubleClick={handleProjectSelect}
                            // --- PASS NEW PROPS ---
                            isConverting={isConverting}
                            convertingFile={convertingFile}
                            conversionError={conversionError}
                        />
                        <TocCard
                            title="Available Projects"
                            icon={IconUser}
                            files={[]}
                            onFileDoubleClick={() => {}}
                            // --- PASS DUMMY/DEFAULT PROPS ---
                            isConverting={false}
                            convertingFile={null}
                            conversionError={null}
                        />
                    </SimpleGrid>
                </SimpleGrid>
                <Box style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Text
                        c="white"
                        size="lg"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            padding: '10px',
                            borderRadius: '8px',
                            display: 'inline-block'
                        }}
                    >
                        {backendMessage || 'Loading...'}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

export default ProjectSelection;