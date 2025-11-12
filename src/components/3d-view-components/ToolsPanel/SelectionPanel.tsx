// src/components/ToolsPanel/SelectionPanel.tsx
import React, { useState, useEffect } from 'react';
import {
    Group,
    Button,
    Stack,
    ColorInput,
    Popover,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import {
    IconFocus2,
    IconEyeOff,
    IconEye,
    IconPalette,
    IconCheck
} from '@tabler/icons-react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as FRAGS from '@thatopen/fragments';
import * as THREE from 'three';
import { useViewer } from '../ViewerContext';

export const SelectionPanel: React.FC = () => {
    const { components, world } = useViewer();
    const [selectedColor, setSelectedColor] = useState('#bcf124');
    const [colorPickerOpened, setColorPickerOpened] = useState(false);
    const [isSimpleCamera, setIsSimpleCamera] = useState(false);

    useEffect(() => {
        if (!world) return;
        setIsSimpleCamera(world.camera instanceof OBC.SimpleCamera);
    }, [world]);

    if (!components || !world) return null;

    const handleFocus = async () => {
        if (!isSimpleCamera) return;
        const highlighter = components.get(OBF.Highlighter);
        const selection = highlighter.selection.select;
        await world.camera.fitToItems(
            OBC.ModelIdMapUtils.isEmpty(selection) ? undefined : selection
        );
    };

    const handleHide = async () => {
        const highlighter = components.get(OBF.Highlighter);
        const hider = components.get(OBC.Hider);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
        await hider.set(false, selection);
    };

    const handleIsolate = async () => {
        const highlighter = components.get(OBF.Highlighter);
        const hider = components.get(OBC.Hider);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
        await hider.isolate(selection);
    };

    const handleApplyColor = async () => {
        const highlighter = components.get(OBF.Highlighter);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

        const color = new THREE.Color(selectedColor);
        highlighter.styles.set(selectedColor, {
            color,
            renderedFaces: FRAGS.RenderedFaces.ONE,
            opacity: 1,
            transparent: false,
        });

        await highlighter.highlightByID(selectedColor, selection, false, false);
        await highlighter.clear('select');
        setColorPickerOpened(false);
    };

    return (
        <Stack spacing="sm">
            <Group grow>
                {isSimpleCamera && (
                    <Tooltip label="Focus Selection">
                        <Button
                            leftIcon={<IconFocus2 size={16} />}
                            variant="light"
                            onClick={handleFocus}
                            size="xs"
                        >
                            Focus
                        </Button>
                    </Tooltip>
                )}

                <Tooltip label="Hide Selection">
                    <Button
                        leftIcon={<IconEyeOff size={16} />}
                        variant="light"
                        onClick={handleHide}
                        size="xs"
                    >
                        Hide
                    </Button>
                </Tooltip>
            </Group>

            <Group grow>
                <Tooltip label="Isolate Selection">
                    <Button
                        leftIcon={<IconEye size={16} />}
                        variant="light"
                        onClick={handleIsolate}
                        size="xs"
                    >
                        Isolate
                    </Button>
                </Tooltip>

                <Popover
                    opened={colorPickerOpened}
                    onChange={setColorPickerOpened}
                    position="bottom"
                    withArrow
                    shadow="md"
                >
                    <Popover.Target>
                        <Tooltip label="Colorize Selection">
                            <Button
                                leftIcon={<IconPalette size={16} />}
                                variant="light"
                                onClick={() => setColorPickerOpened((o) => !o)}
                                size="xs"
                            >
                                Color
                            </Button>
                        </Tooltip>
                    </Popover.Target>

                    <Popover.Dropdown>
                        <Stack spacing="xs">
                            <ColorInput
                                value={selectedColor}
                                onChange={setSelectedColor}
                                format="hex"
                                swatches={[
                                    '#25262b', '#868e96', '#fa5252', '#e64980',
                                    '#be4bdb', '#7950f2', '#4c6ef5', '#228be6',
                                    '#15aabf', '#12b886', '#40c057', '#82c91e',
                                    '#fab005', '#fd7e14'
                                ]}
                            />
                            <Button
                                leftIcon={<IconCheck size={14} />}
                                onClick={handleApplyColor}
                                size="xs"
                            >
                                Apply Color
                            </Button>
                        </Stack>
                    </Popover.Dropdown>
                </Popover>
            </Group>
        </Stack>
    );
};