// src/components/ToolsPanel/SearchPanel.tsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
    TextInput,
    Stack,
    Text,
    ScrollArea,
    Group,
    Badge,
    Loader,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import { IconSearch, IconX, IconCategory, IconFocus2 } from '@tabler/icons-react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as THREE from 'three';
import { useViewer } from '../ViewerContext';

const MAIN_CATEGORIES = [
    'IFCWALL', 'IFCSLAB', 'IFCBEAM', 'IFCCOLUMN', 'IFCDOOR',
    'IFCWINDOW', 'IFCSPACE', 'IFCSTAIR', 'IFCROOF'
];

interface SearchResult {
    type: 'category' | 'element';
    name: string;
    category?: string;
    expressID?: number;
    modelUUID?: string;
}

export const SearchPanel: React.FC = () => {
    // ✅ FIX: Get currentModel directly from context
    const { components, world, currentModel, modelReady } = useViewer();

    // ✅ FIX: Removed the duplicate [currentModel, setCurrentModel]

    const [categoryData, setCategoryData] = useState<Map<string, OBC.ModelIdMap>>(new Map());
    const [elementIndex, setElementIndex] = useState<Map<string, SearchResult>>(new Map());

    const [searchQuery, setSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // ✅ FIX: Removed the local model management useEffect.
    // The context now provides the currentModel directly.

    // ✅ FIXED: Build searchable index using getItemsOfCategories
    const buildSearchIndex = useCallback(async () => {
        // ✅ Use modelReady from context to know when to run
        if (!components || !currentModel || !modelReady) return;

        setLoading(true);
        const newCategoryData = new Map<string, OBC.ModelIdMap>();
        const newElementIndex = new Map<string, SearchResult>();

        try {
            const ifcLoader = components.get(OBC.IfcLoader);

            // Get all IFC types using a broad regex approach
            const categoryRegexes = MAIN_CATEGORIES.map(cat => {
                const type = cat.replace('IFC', '');
                return new RegExp(type, 'i');
            });

            console.log('Building search index for categories:', MAIN_CATEGORIES);

            // Query each category type
            for (let i = 0; i < MAIN_CATEGORIES.length; i++) {
                const mainCat = MAIN_CATEGORIES[i];
                const regex = categoryRegexes[i];

                try {
                    const items = await currentModel.getItemsOfCategories([regex]);
                    const expressIDs = Object.values(items).flat();

                    if (expressIDs.length > 0) {
                        const modelIdMap: OBC.ModelIdMap = {
                            [currentModel.uuid]: new Set(expressIDs)
                        };

                        newCategoryData.set(mainCat, modelIdMap);

                        // Add category to search index
                        newElementIndex.set(mainCat.toLowerCase(), {
                            type: 'category',
                            name: `${mainCat.replace('IFC', '')} (${expressIDs.length} items)`,
                            category: mainCat
                        });

                        // Index individual elements (limit to first 100 per category to avoid performance issues)
                        const sampleSize = Math.min(expressIDs.length, 100);
                        for (let j = 0; j < sampleSize; j++) {
                            const expressID = expressIDs[j];
                            let elementName = `${mainCat}-${expressID}`;

                            // Try to get name from IFC properties
                            try {
                                if (ifcLoader.api && currentModel.ifcMetadata) {
                                    const props = await ifcLoader.api.getProperties(
                                        currentModel.ifcMetadata.ifcModelID,
                                        expressID
                                    );
                                    if (props && props.Name && props.Name.value) {
                                        elementName = props.Name.value;
                                    }
                                }
                            } catch (e) {
                                // Properties not available, use default name
                            }

                            const searchKey = `${mainCat}:${elementName}:${expressID}`.toLowerCase();
                            newElementIndex.set(searchKey, {
                                type: 'element',
                                name: elementName,
                                category: mainCat,
                                expressID: expressID,
                                modelUUID: currentModel.uuid
                            });
                        }

                        console.log(`Indexed ${sampleSize} elements for ${mainCat}`);
                    }
                } catch (err) {
                    console.warn(`Error indexing ${mainCat}:`, err);
                }
            }

            setCategoryData(newCategoryData);
            setElementIndex(newElementIndex);
            console.log(`Search index built: ${newElementIndex.size} entries`);

        } catch (err) {
            console.error('Error building search index:', err);
            setCategoryData(new Map());
            setElementIndex(new Map());
        } finally {
            setLoading(false);
        }
    }, [components, currentModel, modelReady]); // ✅ Depend on modelReady

    useEffect(() => {
        // ✅ Run indexing when the model from context is ready
        if (currentModel && modelReady) {
            void buildSearchIndex();
        } else {
            // Clear data if model is removed
            setCategoryData(new Map());
            setElementIndex(new Map());
        }
    }, [currentModel, modelReady, buildSearchIndex]); // ✅ Depend on modelReady

    // Search handler
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (value.trim() === '') {
            setRecommendations([]);
            return;
        }

        const query = value.toLowerCase();
        const results: SearchResult[] = [];

        // Search through all indexed items
        for (const [key, result] of elementIndex) {
            if (key.includes(query) || result.name.toLowerCase().includes(query)) {
                results.push(result);
                if (results.length >= 20) break; // Limit results
            }
        }

        // Sort: categories first, then elements
        results.sort((a, b) => {
            if (a.type === 'category' && b.type === 'element') return -1;
            if (a.type === 'element' && b.type === 'category') return 1;
            return a.name.localeCompare(b.name);
        });

        setRecommendations(results);
    };

    // ✅ FIXED: Handle selection with proper focusing
    const handleSelectResult = async (result: SearchResult) => {
        if (!components || !world || !currentModel) return;

        const highlighter = components.get(OBF.Highlighter);
        const styleName = 'search-highlight';

        // Prepare selection map
        let selectionMap: OBC.ModelIdMap;

        if (result.type === 'category' && result.category) {
            // Select entire category
            const items = categoryData.get(result.category);
            if (!items || Object.keys(items).length === 0) {
                console.warn(`No items for category ${result.category}`);
                return;
            }
            selectionMap = items;
        } else if (result.type === 'element' && result.expressID && result.modelUUID) {
            // Select single element
            selectionMap = {
                [result.modelUUID]: new Set([result.expressID])
            };
        } else {
            return;
        }

        // Highlight the selection
        if (!highlighter.styles.has(styleName)) {
            highlighter.styles.set(styleName, {
                color: new THREE.Color(0xff6b00), // Orange
                renderedFaces: 1,
                opacity: 0.8,
                transparent: true,
            });
        }

        await highlighter.highlightByID(styleName, selectionMap, true, true);

        // Fit camera to selection
        if (world.camera instanceof OBC.SimpleCamera) {
            try {
                await world.camera.fitToItems(selectionMap, true);
            } catch (error) {
                console.warn('Could not fit camera to selection:', error);
            }
        }

        // Clear search
        setSearchQuery('');
        setRecommendations([]);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setRecommendations([]);
    };

    // Get icon for result type
    const getResultIcon = (result: SearchResult) => {
        return result.type === 'category' ? <IconCategory size={12} /> : <IconFocus2 size={12} />;
    };

    // Get color for result type
    const getResultColor = (result: SearchResult) => {
        return result.type === 'category' ? 'blue' : 'cyan';
    };

    return (
        <Stack spacing="sm">
            <TextInput
                placeholder="Search elements or categories..."
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.currentTarget.value)}
                disabled={!currentModel}
                rightSection={
                    searchQuery ? (
                        <ActionIcon size="sm" onClick={clearSearch}>
                            <IconX size={14} />
                        </ActionIcon>
                    ) : (
                        <IconSearch size={16} />
                    )
                }
            />

            {!currentModel ? (
                <Text size="sm" color="dimmed" align="center">
                    Load a model to search
                </Text>
            ) : loading ? (
                <Group position="center">
                    <Loader size="sm" />
                    <Text size="sm" color="dimmed">Building search index...</Text>
                </Group>
            ) : recommendations.length > 0 ? (
                <ScrollArea.Autosize mah={300}>
                    <Stack spacing="xs">
                        {recommendations.map((result, idx) => (
                            <Tooltip
                                key={`${result.type}-${idx}`}
                                label={
                                    result.type === 'category'
                                        ? `Select all ${result.category} elements`
                                        : `Focus on ${result.name}`
                                }
                            >
                                <Badge
                                    variant="light"
                                    color={getResultColor(result)}
                                    fullWidth
                                    leftSection={getResultIcon(result)}
                                    styles={{
                                        root: {
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                transform: 'translateX(2px)',
                                                backgroundColor: `var(--mantine-color-${getResultColor(result)}-light)`
                                            }
                                        },
                                        inner: {
                                            justifyContent: 'flex-start',
                                            textTransform: 'none'
                                        }
                                    }}
                                    onClick={() => handleSelectResult(result)}
                                >
                                    <Group spacing={4}>
                                        <Text size="xs" weight={500}>{result.name}</Text>
                                        {result.type === 'element' && result.category && (
                                            <Text size="xs" color="dimmed">
                                                [{result.category.replace('IFC', '')}]
                                            </Text>
                                        )}
                                    </Group>
                                </Badge>
                            </Tooltip>
                        ))}
                    </Stack>
                </ScrollArea.Autosize>
            ) : searchQuery && elementIndex.size > 0 ? (
                <Text size="sm" color="dimmed" align="center">
                    No matching elements found
                </Text>
            ) : elementIndex.size > 0 ? (
                <Text size="xs" color="dimmed" align="center">
                    {elementIndex.size} elements indexed
                </Text>
            ) : null}
        </Stack>
    );
};