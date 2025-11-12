// src/components/ToolsPanel/VisibilityPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Group,
    Button,
    Stack,
    Text,
    ScrollArea,
    ActionIcon,
    Tooltip,
    Badge,
    Divider,
    Loader
} from '@mantine/core';
import {
    IconWorld,
    IconGridDots,
    IconEye,
    IconEyeOff,
    IconGhost2,
    IconFocus2,
    IconRefresh
} from '@tabler/icons-react';
import * as FRAGS from '@thatopen/fragments';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import { useViewer } from '../ViewerContext';

const MAIN_CATEGORIES = [
    'IFCWALL', 'IFCSLAB', 'IFCBEAM', 'IFCCOLUMN', 'IFCDOOR',
    'IFCWINDOW', 'IFCSPACE', 'IFCSTAIR', 'IFCROOF'
];

interface CategoryState {
    name: string;
    isIsolated: boolean;
    isGhosted: boolean;
    isHidden: boolean;
}

export const VisibilityPanel: React.FC = () => {
    // ✅ components is now used in extractCategories
    const { components, world } = useViewer();
    const [gridVisible, setGridVisible] = useState(true);
    const [currentModel, setCurrentModel] = useState<any>(null);

    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [categoryMap, setCategoryMap] = useState<Map<string, string[]>>(new Map());

    const [isolatedCategory, setIsolatedCategory] = useState<string | null>(null);
    const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
    const [ghostedCategories, setGhostedCategories] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // Model management (unchanged)
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
                setCategoryMap(new Map());
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

    // ✅✅✅ CORE FIX: extractCategories
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
            console.error('Error extracting categories:', err);
            setCategoryMap(new Map());
            setAvailableCategories([]);
        } finally {
            setLoading(false);
        }
        // ✅ Add components to dependency array
    }, [components, currentModel]);

    // useEffect for extraction (unchanged)
    useEffect(() => {
        if (currentModel) {
            void extractCategories();
        } else {
            setAvailableCategories([]);
            setCategoryMap(new Map());
            setIsolatedCategory(null);
            setHiddenCategories(new Set());
            setGhostedCategories(new Set());
        }
    }, [currentModel, extractCategories]);

    // Grid handlers (unchanged)
    useEffect(() => {
        if (!components || !world) return;
        const grids = components.get(OBC.Grids);
        const worldGrid = grids.list.get(world.uuid);
        if (worldGrid) {
            setGridVisible(worldGrid.visible);
        }
    }, [components, world]);

    const handleToggleGrid = () => {
        if (!components || !world) return;
        const grids = components.get(OBC.Grids);
        const worldGrid = grids.list.get(world.uuid);
        if (worldGrid) {
            worldGrid.visible = !gridVisible;
            setGridVisible(worldGrid.visible);
        }
    };

    // handleShowAll (unchanged)
    const handleShowAll = async () => {
        if (!components || !world) return;
        const hider = components.get(OBC.Hider);
        const highlighter = components.get(OBF.Highlighter);
        const clipper = components.get(OBC.Clipper);
        const fragments = components.get(OBC.FragmentsManager);

        await hider.set(true);
        await highlighter.clear();
        await clipper.delete(world);
        setIsolatedCategory(null);
        setHiddenCategories(new Set());
        setGhostedCategories(new Set());

        if (world.camera instanceof OBC.SimpleCamera && fragments.list.size > 0) {
            let overallBBox: THREE.Box3 | null = null;
            for (const [_, model] of fragments.list) {
                const modelBBox = (model as any).boundingBox;
                if (modelBBox && !modelBBox.isEmpty()) {
                    overallBBox = overallBBox ? overallBBox.union(modelBBox) : modelBBox.clone();
                }
            }
            if (overallBBox && !overallBBox.isEmpty()) {
                const sphere = new THREE.Sphere();
                overallBBox.getBoundingSphere(sphere);
                await world.camera.controls.fitToSphere(sphere, true);
            }
        }
        await fragments.core.update(true);
    };

    // Category handlers

    // ✅✅✅ FIX IS HERE ✅✅✅
    const getItemsForCategory = async (category: string) => {
        if (!currentModel || !categoryMap.has(category)) return null;

        // Get the list of *original* names, e.g., ["IFCWALL", "IFCWALLSTANDARDCASE"]
        const originalCats = categoryMap.get(category);
        if (!originalCats || originalCats.length === 0) return null;

        // ✅ FIX: Use the *strict* regex, which now works because
        // the category names from ifcLoader.categories are precise.
        const categoryRegexes = originalCats.map(cat => new RegExp(`^${cat}$`, 'i'));

        // Query the model using the *original* names as regexes
        const items = await currentModel.getItemsOfCategories(categoryRegexes);

        const localIds = Object.values(items).flat();
        if (localIds.length === 0) return null;

        return { [currentModel.uuid]: new Set(localIds) } as OBC.ModelIdMap;
    };

    // handleToggleIsolate (unchanged)
    const handleToggleIsolate = async (category: string) => {
        if (!components) return;
        const hider = components.get(OBC.Hider);

        if (isolatedCategory === category) {
            await hider.set(true);
            setIsolatedCategory(null);
        } else {
            const items = await getItemsForCategory(category);
            if (!items) {
                console.warn(`No items found for category ${category} to isolate.`);
                return;
            }
            await hider.isolate(items);
            setIsolatedCategory(category);
        }
        setHiddenCategories(new Set());
        setGhostedCategories(new Set());
    };

    // handleToggleHide (unchanged)
    const handleToggleHide = async (category: string) => {
        if (!components) return;
        const hider = components.get(OBC.Hider);
        const items = await getItemsForCategory(category);
        if (!items) return;

        const newHidden = new Set(hiddenCategories);
        if (hiddenCategories.has(category)) {
            await hider.set(true, items);
            newHidden.delete(category);
        } else {
            await hider.set(false, items);
            newHidden.add(category);
        }
        setHiddenCategories(newHidden);
    };

    // handleToggleGhost (unchanged)
    const handleToggleGhost = async (category: string) => {
        if (!components) return;
        const highlighter = components.get(OBF.Highlighter);
        const items = await getItemsForCategory(category);
        if (!items) return;

        const styleName = `ghost-${category}`;
        const newGhosted = new Set(ghostedCategories);

        if (ghostedCategories.has(category)) {
            await highlighter.clear(styleName);
            newGhosted.delete(category);
        } else {
            if (!highlighter.styles.has(styleName)) {

                const isSpace = category === 'IFCSPACE';
                const ghostColor = isSpace ? new THREE.Color(0x00ff00) : new THREE.Color(0xaaaaaa);
                const ghostOpacity = isSpace ? 0.25 : 0.15;

                highlighter.styles.set(styleName, {
                    color: ghostColor,
                    opacity: ghostOpacity,
                    transparent: true,
                    renderedFaces: FRAGS.RenderedFaces.ALL,
                });
            }
            await highlighter.highlightByID(styleName, items, false, false);
            newGhosted.add(category);
        }
        setGhostedCategories(newGhosted);
    };

    // JSX (return) part (unchanged)
    return (
        <Stack spacing="sm">
            {/* Global Controls */}
            <Group grow>
                <Tooltip label="Show All & Reset">
                    <Button
                        leftIcon={<IconWorld size={16} />}
                        variant="light"
                        onClick={handleShowAll}
                        size="xs"
                    >
                        Reset
                    </Button>
                </Tooltip>
                <Tooltip label={`Toggle Grid (${gridVisible ? 'On' : 'Off'})`}>
                    <Button
                        leftIcon={<IconGridDots size={16} />}
                        variant={gridVisible ? "filled" : "outline"}
                        onClick={handleToggleGrid}
                        size="xs"
                    >
                        Grid
                    </Button>
                </Tooltip>
            </Group>

            <Divider my="xs" />

            {/* Categories List */}
            <ScrollArea.Autosize mah={300}>
                <Stack spacing="xs">
                    {!currentModel ? (
                        <Text size="sm" color="dimmed" align="center">
                            Load a model to see categories
                        </Text>
                    ) : loading ? (
                        <Group position="center">
                            <Loader size="sm" />
                            <Text size="sm" color="dimmed">Extracting categories...</Text>
                        </Group>
                    ) : availableCategories.length === 0 ? (
                        <Text size="sm" color="dimmed" align="center">
                            No categories found
                        </Text>
                    ) : (
                        availableCategories.map(category => {
                            const isIsolated = isolatedCategory === category;
                            const isGhosted = ghostedCategories.has(category);
                            const isHidden = hiddenCategories.has(category);
                            const isDisabled = isolatedCategory !== null && !isIsolated;

                            return (
                                <Group key={category} position="apart" nowrap>
                                    <Badge
                                        variant="light"
                                        color={isIsolated ? "blue" : isGhosted ? "gray" : isHidden ? "red" : "gray"}
                                        fullWidth
                                        styles={{
                                            inner: {
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                textTransform: 'none'
                                            }
                                        }}
                                    >
                                        {category.replace('IFC', '')}
                                    </Badge>

                                    <Group spacing="xs" nowrap>
                                        <Tooltip label={isIsolated ? "Show All" : "Isolate"}>
                                            <ActionIcon
                                                color={isIsolated ? "blue" : "gray"}
                                                variant={isIsolated ? "filled" : "subtle"}
                                                onClick={() => handleToggleIsolate(category)}
                                                size="sm"
                                            >
                                                <IconFocus2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <Tooltip label={isGhosted ? "Unghost" : "Ghost"}>
                                            <ActionIcon
                                                color={isGhosted ? (category === 'IFCSPACE' ? 'green' : 'gray') : "blue"}
                                                variant={isGhosted ? "filled" : "subtle"}
                                                onClick={() => handleToggleGhost(category)}
                                                disabled={isDisabled || isHidden}
                                                size="sm"
                                            >
                                                <IconGhost2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <Tooltip label={isHidden ? "Show" : "Hide"}>
                                            <ActionIcon
                                                color={isHidden ? "red" : "gray"}
                                                variant={isHidden ? "filled" : "subtle"}
                                                onClick={() => handleToggleHide(category)}
                                                disabled={isDisabled}
                                                size="sm"
                                            >
                                                {isHidden ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            );
                        })
                    )}
                </Stack>
            </ScrollArea.Autosize>

            <Divider my="xs" />

            {/* Refresh Button */}
            <Group position="center">
                <Tooltip label="Refresh category list (if model changed)">
                    <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={extractCategories}
                        leftIcon={<IconRefresh size={14} />}
                        disabled={loading || !currentModel}
                    >
                        Refresh
                    </Button>
                </Tooltip>
            </Group>

        </Stack>
    );
};