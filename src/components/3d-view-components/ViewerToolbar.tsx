// src/components/ViewerToolbar.tsx
import React, { useState, useEffect } from 'react';
import * as OBC from '@thatopen/components'; // <-- Corrected line
import * as OBF from '@thatopen/components-front';
import * as FRAGS from '@thatopen/fragments';
import * as THREE from 'three';
import { useViewer } from './ViewerContext.tsx';

const ViewerToolbar: React.FC = () => {
    const { components, world } = useViewer(); // Hook 1

    const [isGhostMode, setIsGhostMode] = useState(false); // Hook 2
    const [selectedColor, setSelectedColor] = useState('#bcf124'); // Hook 3
    const [showColorPicker, setShowColorPicker] = useState(false); // Hook 4
    const [isSimpleCamera, setIsSimpleCamera] = useState(false); // Hook 5

    useEffect(() => {
        if (world) {
            setIsSimpleCamera(world.camera instanceof OBC.SimpleCamera);
        }
    }, [world]);

    if (!components || !world) return null; // Guard clause is after all hooks

    const originalColors = new Map<
        FRAGS.BIMMaterial,
        { color: number; transparent: boolean; opacity: number }
    >();

    const setModelTransparent = () => {
        const fragments = components.get(OBC.FragmentsManager);
        const materials = [...fragments.core.models.materials.list.values()];

        for (const material of materials) {
            if (material.userData.customId) continue;
            let color: number | undefined;
            if ('color' in material) color = material.color.getHex();
            else color = material.lodColor.getHex();

            originalColors.set(material, {
                color,
                transparent: material.transparent,
                opacity: material.opacity,
            });

            material.transparent = true;
            material.opacity = 0.05;
            material.needsUpdate = true;
            if ('color' in material) material.color.setColorName('white');
            else material.lodColor.setColorName('white');
        }
    };

    const restoreModelMaterials = () => {
        for (const [material, data] of originalColors) {
            const { color, transparent, opacity } = data;
            material.transparent = transparent;
            material.opacity = opacity;
            if ('color' in material) material.color.setHex(color);
            else material.lodColor.setHex(color);
            material.needsUpdate = true;
        }
        originalColors.clear();
    };

    const handleToggleGhost = () => {
        if (isGhostMode) restoreModelMaterials();
        else setModelTransparent();
        setIsGhostMode(!isGhostMode);
    };

    const handleFocus = async () => {
        if (!(world.camera instanceof OBC.SimpleCamera)) return;
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

    const handleShowAll = async () => {
        const hider = components.get(OBC.Hider);
        await hider.set(true);
    };

    const handleApplyColor = async () => {
        const highlighter = components.get(OBF.Highlighter);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

        const color = new THREE.Color(selectedColor);
        const style = [...highlighter.styles.entries()].find(([, definition]) => {
            if (!definition) return false;
            return definition.color.getHex() === color.getHex();
        });

        if (style) {
            const name = style[0];
            if (name === 'select') return;
            await highlighter.highlightByID(name, selection, false, false);
        } else {
            highlighter.styles.set(selectedColor, {
                color,
                renderedFaces: FRAGS.RenderedFaces.ONE,
                opacity: 1,
                transparent: false,
            });
            await highlighter.highlightByID(selectedColor, selection, false, false);
        }
        await highlighter.clear('select');
        setShowColorPicker(false);
    };

    return (
        <div className="viewer-toolbar">
            <div className="toolbar-section">
                <h4>Visibility</h4>
                <button onClick={handleShowAll} className="btn-toolbar" title="Show All">
                    Show All
                </button>
                <button
                    onClick={handleToggleGhost}
                    className={`btn-toolbar ${isGhostMode ? 'active' : ''}`}
                    title="Toggle Ghost Mode"
                >
                    Ghost
                </button>
            </div>

            <div className="toolbar-section">
                <h4>Selection</h4>
                {isSimpleCamera && (
                    <button onClick={handleFocus} className="btn-toolbar" title="Focus Selection">
                        Focus
                    </button>
                )}
                <button onClick={handleHide} className="btn-toolbar" title="Hide Selection">
                    Hide
                </button>
                <button onClick={handleIsolate} className="btn-toolbar" title="Isolate Selection">
                    Isolate
                </button>
                <div className="color-picker-container">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="btn-toolbar"
                        title="Colorize Selection"
                    >
                        Colorize
                    </button>
                    {showColorPicker && (
                        <div className="color-picker-popup">
                            <input
                                type="color"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                            />
                            <button onClick={handleApplyColor} className="btn-primary">
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewerToolbar;