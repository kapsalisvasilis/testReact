// src/components/ToolsPanel/SearchPanel.tsx
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
import { IconSearch, IconX, IconCategory } from '@tabler/icons-react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as THREE from 'three';
import { useViewer } from '../ViewerContext';

// 1. Unchanged
const MAIN_CATEGORIES = [
    'IFCWALL', 'IFCSLAB', 'IFCBEAM', 'IFCCOLUMN', 'IFCDOOR',
    'IFCWINDOW', 'IFCSPACE', 'IFCSTAIR', 'IFCROOF'
];

export const SearchPanel: React.FC = () => {
    // ✅ components is now used in extractCategories
    const { components, world } = useViewer();
    const [currentModel, setCurrentModel] = useState<any>(null);

    // 2. Unchanged
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    // 3. Unchanged
    const [categoryMap, setCategoryMap] = useState<Map<string, string[]>>(new Map());

    const [searchQuery, setSearchQuery] = useState('');
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // This useEffect (Model Management) is unchanged
    useEffect(() => {
        if (!components) return;
        const fragments = components.get(OBC.FragmentsManager);

        const updateCurrentModel = () => {
            if (fragments.list.size > 0) {
                const firstModel = Array.from(fragments.list.values())[0];
                setCurrentModel(firstModel);
            } else {
                setCurrentModel(null);
                setAvailableCategories([]);
                setCategoryMap(new Map()); // Clear map
            }
        };

        fragments.list.onItemSet.add(updateCurrentModel);
        fragments.list.onItemDeleted.add(updateCurrentModel);
        updateCurrentModel();

        return () => {
            if (fragments.isDisposed) return;
            fragments.list.onItemSet.remove(updateCurrentModel);
            fragments.list.onItemDeleted.remove(updateCurrentModel);
        };
    }, [components]);

    // ✅ 4. CORE FIX: extractCategories
    // We now read from the IfcLoader, not the model's getItemsOfCategories
    const extractCategories = useCallback(async () => {
        // We need both the components and a model to be present
        if (!components || !currentModel) return;
        setLoading(true);
        const newCategoryMap = new Map<string, string[]>();

        try {
            // 1. Get the IfcLoader
            const ifcLoader = components.get(OBC.IfcLoader);

            // 2. Check if the loader has the .categories property
            if (!ifcLoader || !ifcLoader.categories) {
                console.warn("IfcLoader or ifcLoader.categories not found.");
                setAvailableCategories([]);
                setCategoryMap(new Map());
                return;
            }

            // 3. Get the *clean* list of categories from the loader
            const originalCategories = Object.keys(ifcLoader.categories);
            if (originalCategories.length === 0) {
                console.warn("ifcLoader.categories is empty.");
                setAvailableCategories([]);
                setCategoryMap(new Map());
                return;
            }

            // 4. Build the map (same logic as before, but on good data)
            for (const originalCat of originalCategories) {
                for (const mainCat of MAIN_CATEGORIES) { // e.g., "IFCWALL"
                    const categoryType = mainCat.replace('IFC', ''); // e.g., "WALL"

                    // e.g., "IFCWALLSTANDARDCASE".includes("WALL")
                    if (originalCat.toUpperCase().includes(categoryType)) {
                        if (!newCategoryMap.has(mainCat)) {
                            newCategoryMap.set(mainCat, []);
                        }
                        // Add the *original* name (e.g., "IFCWALLSTANDARDCASE")
                        newCategoryMap.get(mainCat)!.push(originalCat);
                        break;
                    }
                }
            }

            setCategoryMap(newCategoryMap);
            setAvailableCategories(Array.from(newCategoryMap.keys()).sort());

        } catch (err) {
            console.error('Error extracting categories for search:', err);
            setAvailableCategories([]);
            setCategoryMap(new Map());
        } finally {
            setLoading(false);
        }
        // ✅ Add components to dependency array
    }, [components, currentModel]);

    // This useEffect (data fetching) is unchanged
    useEffect(() => {
        if (currentModel) {
            void extractCategories();
        } else {
            setAvailableCategories([]);
            setCategoryMap(new Map());
        }
    }, [currentModel, extractCategories]);

    // 5. handleSearchChange (unchanged)
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (value.trim() === '') {
            setRecommendations([]);
        } else {
            const matchingCategories = availableCategories.filter(cat =>
                cat.toLowerCase().includes(value.toLowerCase())
            );
            setRecommendations(matchingCategories.slice(0, 10));
        }
    };

    // 6. handleSelectRecommendation (This logic is now correct)
    const handleSelectRecommendation = async (category: string) => {
        if (!components || !world || !currentModel || !categoryMap.has(category)) return;

        const highlighter = components.get(OBF.Highlighter);

        // Get original category names from the map, e.g., ["IFCWALL", "IFCWALLSTANDARDCASE"]
        const originalCats = categoryMap.get(category);
        if (!originalCats || originalCats.length === 0) return;

        // Create *strict* regexes, which will now work
        const categoryRegexes = originalCats.map(cat => new RegExp(`^${cat}$`, 'i'));

        // Query using the *original* names
        const items = await currentModel.getItemsOfCategories(categoryRegexes);

        const localIds = Object.values(items).flat();
        if (localIds.length === 0) {
            console.warn(`No items found for category ${category} in search.`);
            return;
        }

        const selectionMap: OBC.ModelIdMap = { [currentModel.uuid]: new Set(localIds) };
        const styleName = 'search-highlight';

        if (!highlighter.styles.has(styleName)) {
            highlighter.styles.set(styleName, {
                color: new THREE.Color(0xff0000), // Red
                renderedFaces: 1,
                opacity: 1,
                transparent: false,
            });
        }

        await highlighter.highlightByID(styleName, selectionMap, true, true);

        if (world.camera instanceof OBC.SimpleCamera) {
            await world.camera.fitToItems(selectionMap, true);
        }

        setSearchQuery('');
        setRecommendations([]);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setRecommendations([]);
    };

    // The JSX (return) part is unchanged
    return (
        <Stack spacing="sm">
            <TextInput
                placeholder="Search categories (e.g., Wall)"
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
                    <Text size="sm" color="dimmed">Loading categories...</Text>
                </Group>
            ) : recommendations.length > 0 ? (
                <ScrollArea.Autosize mah={200}>
                    <Stack spacing="xs">
                        {recommendations.map(category => (
                            <Tooltip key={category} label={`Select all ${category} elements`}>
                                <Badge
                                    variant="light"
                                    fullWidth
                                    leftSection={<IconCategory size={12} />}
                                    styles={{
                                        root: {
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                transform: 'translateX(2px)',
                                                backgroundColor: 'var(--mantine-color-blue-light)'
                                            }
                                        },
                                        inner: {
                                            justifyContent: 'flex-start',
                                            textTransform: 'none'
                                        }
                                    }}
                                    onClick={() => handleSelectRecommendation(category)}
                                >
                                    {/* 7. Clean up the display name */}
                                    {category.replace('IFC', '')}
                                </Badge>
                            </Tooltip>
                        ))}
                    </Stack>
                </ScrollArea.Autosize>
            ) : searchQuery && availableCategories.length > 0 ? (
                <Text size="sm" color="dimmed" align="center">
                    No matching categories found
                </Text>
            ) : null}
        </Stack>
    );
};