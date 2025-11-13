// src/components/ToolsPanel/VisibilityPanel.tsx - FIXED WORKING VERSION
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
    Loader,
} from '@mantine/core';
import {
    IconWorld,
    IconGridDots,
    IconEye,
    IconEyeOff,
    IconGhost2,
    IconFocus2,
    IconRefresh,
} from '@tabler/icons-react';
import * as THREE from 'three';
import * as FRAGS from '@thatopen/fragments';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import { useViewer } from '../ViewerContext';

const MAIN_CATEGORIES = [
    'IFCWALL',
    'IFCSLAB',
    'IFCBEAM',
    'IFCCOLUMN',
    'IFCDOOR',
    'IFCWINDOW',
    'IFCSPACE',
    'IFCSTAIR',
    'IFCROOF',
];

interface CategoryData {
    mainCategory: string;
    items: OBC.ModelIdMap;
    count: number;
}

export const VisibilityPanel: React.FC = () => {
    const { components, world, currentModel, modelReady } = useViewer();
    const [gridVisible, setGridVisible] = useState(true);

    const [categoryData, setCategoryData] = useState<Map<string, CategoryData>>(new Map());
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [isolatedCategory, setIsolatedCategory] = useState<string | null>(null);
    const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
    const [ghostedCategories, setGhostedCategories] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // ✅ Extract categories using getItemsOfCategories - works for both IFC and .frag
    const extractCategories = useCallback(async () => {
        if (!components || !currentModel || !modelReady || !currentModel.uuid) return;

        setLoading(true);
        const newData = new Map<string, CategoryData>();

        try {
            // Get all IFC types using a broad regex approach for each main category
            const categoryRegexes = MAIN_CATEGORIES.map(cat => new RegExp(cat, 'i'));

            for (let i = 0; i < MAIN_CATEGORIES.length; i++) {
                const mainCat = MAIN_CATEGORIES[i];
                const regex = categoryRegexes[i];

                const items = await currentModel.getItemsOfCategories([regex]);
                const expressIDs = Object.values(items).flat() as number[];
                const count = expressIDs.length;

                if (count > 0) {
                    newData.set(mainCat, {
                        mainCategory: mainCat,
                        items: { [currentModel.uuid]: new Set(expressIDs) },
                        count,
                    });
                    console.log(`✅ Found ${count} items for ${mainCat}`);
                }
            }

            setCategoryData(newData);
            setAvailableCategories(Array.from(newData.keys()).sort((a, b) => a.localeCompare(b)));
        } catch (err) {
            console.error('extractCategories failed:', err);
        } finally {
            setLoading(false);
        }
    }, [components, currentModel, modelReady]);

    useEffect(() => {
        if (currentModel && modelReady && currentModel.uuid) {
            void extractCategories();
        } else {
            setAvailableCategories([]);
            setCategoryData(new Map());
        }
    }, [currentModel, modelReady, extractCategories]);

    // Grid
    useEffect(() => {
        if (!components || !world) return;
        const grids = components.get(OBC.Grids);
        const g = grids.list.get(world.uuid);
        if (g) setGridVisible(g.visible);
    }, [components, world]);

    const handleToggleGrid = () => {
        if (!components || !world) return;
        const grids = components.get(OBC.Grids);
        const g = grids.list.get(world.uuid);
        if (g) {
            g.visible = !gridVisible;
            setGridVisible(g.visible);
        }
    };

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

        // Fit camera to all
        if (fragments.list.size > 0) {
            let overall: THREE.Box3 | null = null;
            for (const [, model] of fragments.list) {
                const bb = (model as any).boundingBox;
                if (bb && !bb.isEmpty()) {
                    overall = overall ? overall.union(bb) : bb.clone();
                }
            }
            if (overall && !overall.isEmpty()) {
                const sphere = new THREE.Sphere();
                overall.getBoundingSphere(sphere);
                await world.camera.controls.fitToSphere(sphere, true);
            }
        }
        await components.get(OBC.FragmentsManager).core.update(true);
    };

    const handleToggleIsolate = async (category: string) => {
        if (!components || !currentModel) return;
        const hider = components.get(OBC.Hider);
        const data = categoryData.get(category);
        if (!data) return;

        if (isolatedCategory === category) {
            await hider.set(true);
            setIsolatedCategory(null);
        } else {
            await hider.isolate(data.items);
            setIsolatedCategory(category);
        }

        setHiddenCategories(new Set());
        setGhostedCategories(new Set());
    };

    const handleToggleHide = async (category: string) => {
        if (!components) return;
        const hider = components.get(OBC.Hider);
        const data = categoryData.get(category);
        if (!data) return;

        const newHidden = new Set(hiddenCategories);
        if (hiddenCategories.has(category)) {
            await hider.set(true, data.items);
            newHidden.delete(category);
        } else {
            await hider.set(false, data.items);
            newHidden.add(category);
        }
        setHiddenCategories(newHidden);
    };

    const handleToggleGhost = async (category: string) => {
        if (!components) return;
        const highlighter = components.get(OBF.Highlighter);
        const data = categoryData.get(category);
        if (!data) return;

        const styleName = `ghost-${category}`;
        const newGhosted = new Set(ghostedCategories);

        if (ghostedCategories.has(category)) {
            await highlighter.clear(styleName);
            newGhosted.delete(category);
        } else {
            const isSpace = category.toUpperCase().includes('SPACE');
            const ghostColor = isSpace ? new THREE.Color(0x00ff00) : new THREE.Color(0xaaaaaa);
            const ghostOpacity = isSpace ? 0.25 : 0.15;

            highlighter.styles.set(styleName, {
                color: ghostColor,
                opacity: ghostOpacity,
                transparent: true,
                renderedFaces: FRAGS.RenderedFaces.Both,
            });

            await highlighter.highlightByID(styleName, data.items, false, false);
            newGhosted.add(category);
        }
        setGhostedCategories(newGhosted);
    };

    return (
        <Stack spacing="sm">
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
                        variant={gridVisible ? 'filled' : 'outline'}
                        onClick={handleToggleGrid}
                        size="xs"
                    >
                        Grid
                    </Button>
                </Tooltip>
            </Group>

            <Divider my="xs" />

            <ScrollArea.Autosize mah={300}>
                <Stack spacing="xs">
                    {!currentModel ? (
                        <Text align="center" color="dimmed" size="sm">
                            Load a model to see categories
                        </Text>
                    ) : loading ? (
                        <Group position="center">
                            <Loader size="sm" />
                            <Text size="sm" color="dimmed">
                                Extracting categories...
                            </Text>
                        </Group>
                    ) : availableCategories.length === 0 ? (
                        <Text align="center" color="dimmed" size="sm">
                            No categories found
                        </Text>
                    ) : (
                        availableCategories.map(cat => {
                            const isIsolated = isolatedCategory === cat;
                            const isHidden = hiddenCategories.has(cat);
                            const isGhosted = ghostedCategories.has(cat);
                            const disabled = isolatedCategory !== null && !isIsolated;
                            const count = categoryData.get(cat)?.count ?? 0;

                            return (
                                <Group key={cat} position="apart" noWrap>
                                    <Badge
                                        color={
                                            isIsolated ? 'blue' : isGhosted ? 'gray' : isHidden ? 'red' : 'gray'
                                        }
                                        variant="light"
                                        style={{ flex: 1 }}
                                    >
                                        {cat.replace('IFC', '')} ({count})
                                    </Badge>

                                    <Group spacing="xs" noWrap>
                                        <Tooltip label={isIsolated ? 'Show All' : 'Isolate'}>
                                            <ActionIcon
                                                onClick={() => handleToggleIsolate(cat)}
                                                color={isIsolated ? 'blue' : 'gray'}
                                                variant={isIsolated ? 'filled' : 'subtle'}
                                                size="sm"
                                            >
                                                <IconFocus2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <Tooltip label={isGhosted ? 'Unghost' : 'Ghost'}>
                                            <ActionIcon
                                                onClick={() => handleToggleGhost(cat)}
                                                color={isGhosted ? 'gray' : 'blue'}
                                                variant={isGhosted ? 'filled' : 'subtle'}
                                                disabled={disabled || isHidden}
                                                size="sm"
                                            >
                                                <IconGhost2 size={14} />
                                            </ActionIcon>
                                        </Tooltip>

                                        <Tooltip label={isHidden ? 'Show' : 'Hide'}>
                                            <ActionIcon
                                                onClick={() => handleToggleHide(cat)}
                                                color={isHidden ? 'red' : 'gray'}
                                                variant={isHidden ? 'filled' : 'subtle'}
                                                disabled={disabled}
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

            <Group position="center">
                <Tooltip label="Refresh category list">
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

export default VisibilityPanel;