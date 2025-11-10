// ProjectSelectionView.tsx
import React, { useState } from 'react';
import {
    Card,
    Text,
    Title,
    SimpleGrid,
    ThemeIcon,
    Group,
    ScrollArea,
    Box,
    useMantineTheme,
    rem,
    Button,
    Loader,
} from '@mantine/core';
import { IconPlus, IconUpload, IconList, Icon3dCubeSphere } from '@tabler/icons-react';

// --- FeatureCard Component ---
interface FeatureProps {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
    theme: any;
    colors: {
        cardBg: string;
        textColor: string;
    };
}

const FeatureCard: React.FC<FeatureProps> = ({
                                                 icon: Icon,
                                                 title,
                                                 description,
                                                 onClick,
                                                 theme,
                                                 colors: { cardBg, textColor }
                                             }) => (
    <Card
        shadow="md"
        radius="md"
        padding="xl"
        withBorder
        onClick={onClick}
        style={{
            cursor: 'pointer',
            transition: 'transform 0.2s',
            backgroundColor: cardBg,
            border: `1px solid ${theme.colors.dark[5]}`,
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
        <ThemeIcon variant="filled" size={60} radius={60} color="cyan">
            <Icon style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
        </ThemeIcon>
        <Text fz="lg" fw={500} mt="lg" c={textColor}>
            {title}
        </Text>
        <Text fz="sm" c="dimmed" mt="sm">
            {description}
        </Text>
    </Card>
);

// --- FileTocCard Component ---
interface FileTocCardProps {
    title: string;
    icon: React.ElementType;
    files: File[];
    onFileDoubleClick: (file: File) => void;
    isLoading: boolean;
    loadingFile: string | null;
    loadError: string | null;
    theme: any;
    colors: {
        textColor: string;
        cardBg: string;
        accentColor: string;
        accentColorLight: string;
    };
}

const FileTocCard: React.FC<FileTocCardProps> = ({
                                                     title,
                                                     icon: Icon,
                                                     files,
                                                     onFileDoubleClick,
                                                     isLoading,
                                                     loadingFile,
                                                     loadError,
                                                     theme,
                                                     colors: { textColor, cardBg, accentColor, accentColorLight },
                                                 }) => {
    const [active, setActive] = useState<number | null>(null);

    const linkHeight = rem(50);
    const itemMargin = rem(4);
    const indicatorHeight = rem(30);
    const indicatorOffset = `calc((${linkHeight} - ${indicatorHeight}) / 2)`;

    const handleItemLoad = (index: number, file: File) => {
        setActive(index);
        onFileDoubleClick(file);
    };

    const items = files.map((file, index) => {
        const isFileLoading = isLoading && loadingFile === file.name;

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
                <Text
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
                </Text>

                {isFileLoading ? (
                    <Loader size="xs" color="cyan" />
                ) : (
                    <Button
                        size="xs"
                        variant="light"
                        color="cyan"
                        leftSection={<Icon3dCubeSphere size={14} />}
                        onClick={() => handleItemLoad(index, file)}
                        disabled={isLoading}
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
                backgroundColor: cardBg,
                border: `1px solid ${theme.colors.dark[5]}`
            }}
        >
            <style>
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
                    background-color: ${accentColor};
                    border-radius: ${theme.radius.sm};
                    transition: transform 0.2s ease;
                    z-index: 1;
                }

                .toc-item-group {
                    padding: 0 ${rem(12)};
                    border-radius: ${theme.radius.sm};
                }
                
                .toc-item-group:hover {
                    background-color: ${theme.colors.dark[7]};
                }

                .toc-item-group[data-active="true"] {
                    background-color: ${theme.colors.dark[6]};
                }

                .toc-item-anchor {
                    color: ${theme.colors.gray[4]};
                    font-size: ${theme.fontSizes.sm};
                    font-weight: 500;
                    padding: ${rem(4)} ${rem(8)};
                }

                .toc-item-group[data-active="true"] .toc-item-anchor {
                    color: ${accentColorLight};
                    font-weight: 600;
                }
                `}
            </style>

            <Group justify="space-between" mb="md">
                <Title order={4} c={textColor} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
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
                    <Text c="dimmed" fz="sm" ta="center" p="md">
                        No projects found.
                    </Text>
                )}
            </ScrollArea.Autosize>

            {loadError && (
                <Text c="red" fz="sm" ta="center" p="xs" mt="sm">
                    {loadError}
                </Text>
            )}
        </Card>
    );
};

// --- Main Component Props ---
interface ProjectSelectionViewProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isLoading: boolean;
    loadError: string | null;
    loadingFile: string | null;
    backendMessage: string;
    importedFiles: File[];
    onCreateNew: () => void;
    onLoadClick: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onProjectSelect: (file: File) => void;
}

export const ProjectSelectionView: React.FC<ProjectSelectionViewProps> = ({
                                                                              fileInputRef,
                                                                              isLoading,
                                                                              loadError,
                                                                              loadingFile,
                                                                              backendMessage,
                                                                              importedFiles,
                                                                              onCreateNew,
                                                                              onLoadClick,
                                                                              onFileChange,
                                                                              onProjectSelect,
                                                                          }) => {
    const theme = useMantineTheme();

    // Colors
    const textColor = theme.colors.gray[1];
    const cardBg = theme.colors.dark[8];
    const accentColor = theme.colors.cyan[5];
    const accentColorLight = theme.colors.cyan[4];

    const features: FeatureProps[] = [
        {
            icon: IconPlus,
            title: 'Create New Project',
            description: 'Start a new project from scratch. (Coming soon)',
            onClick: onCreateNew,
        },
        {
            icon: IconUpload,
            title: 'Load Existing Project (IFC)',
            description: 'Load an .ifc file from your computer to get started.',
            onClick: onLoadClick,
        },
    ];

    return (
        <Box
            style={{
                padding: '32px',
                height: '100%',
                backgroundColor: theme.colors.indigo[8],
                overflow: 'auto',
            }}
        >
            <input
                type="file"
                accept=".ifc"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileChange}
                multiple
            />

            <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <SimpleGrid cols={1} spacing="xl">
                        {features.map((feature) => (
                            <FeatureCard
                                {...feature}
                                key={feature.title}
                                theme={theme}
                                colors={{ cardBg, textColor }}
                            />
                        ))}
                    </SimpleGrid>

                    <SimpleGrid cols={1} spacing="xl">
                        <FileTocCard
                            title="Imported Projects"
                            icon={IconList}
                            files={importedFiles || []}
                            onFileDoubleClick={onProjectSelect}
                            isLoading={isLoading}
                            loadingFile={loadingFile}
                            loadError={loadError}
                            theme={theme}
                            colors={{ textColor, cardBg, accentColor, accentColorLight }}
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
                        {backendMessage || 'Ready to load IFC files directly'}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};