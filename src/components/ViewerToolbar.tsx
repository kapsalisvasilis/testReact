// src/components/ViewerToolbar.tsx
import React, { useState } from 'react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
import * as FRAGS from '@thatopen/fragments';
import * as THREE from 'three';
// ✅ Import the hook
import { useViewer } from './ViewerContext';

const ViewerToolbar: React.FC = () => {
    // ✅ Get components and world from the hook
    const { components, world } = useViewer();

    const [isGhostMode, setIsGhostMode] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#bcf124');
    const [showColorPicker, setShowColorPicker] = useState(false);

    // ✅ Add guard clause
    if (!components || !world) return null;

    // ✅ Fix useState initializer
    const [isSimpleCamera, setIsSimpleCamera] = useState(() => {
        return world.camera instanceof OBC.SimpleCamera;
    });

    const originalColors = new Map<
        FRAGS.BIMMaterial,
        { color: number; transparent: boolean; opacity: number }
    >();

    const setModelTransparent = () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const fragments = components.get(OBC.FragmentsManager);
        const materials = [...fragments.core.models.materials.list.values()];

        for (const material of materials) {
            // ... (rest of logic is correct)
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
            // ... (rest of logic is correct)
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
        // ⛔ Remove: const world = viewerHandler.getWorld();
        // ⛔ Remove: const components = viewerHandler.getComponents();
        if (!(world.camera instanceof OBC.SimpleCamera)) return;

        const highlighter = components.get(OBF.Highlighter);
        const selection = highlighter.selection.select;
        await world.camera.fitToItems(
            OBC.ModelIdMapUtils.isEmpty(selection) ? undefined : selection
        );
    };

    const handleHide = async () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const highlighter = components.get(OBF.Highlighter);
        const hider = components.get(OBC.Hider);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
        await hider.set(false, selection);
    };

    const handleIsolate = async () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const highlighter = components.get(OBF.Highlighter);
        const hider = components.get(OBC.Hider);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
        await hider.isolate(selection);
    };

    const handleShowAll = async () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const hider = components.get(OBC.Hider);
        await hider.set(true);
    };

    const handleApplyColor = async () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const highlighter = components.get(OBF.Highlighter);
        const selection = highlighter.selection.select;
        if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

        // ... (rest of logic is correct)
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

    // ... (Your JSX is correct)
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