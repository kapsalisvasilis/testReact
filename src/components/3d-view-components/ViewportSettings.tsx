// src/components/ViewportSettings.tsx
import React, { useState, useEffect } from 'react';
import * as OBC from '@thatopen/components';
// ⛔ No longer need OBF
// ✅ Import the hook
import { useViewer } from './ViewerContext.tsx';

// ⛔ Delete junk code from here

const ViewportSettings: React.FC = () => {
    // ✅ Get components and world from hook
    const { components, world } = useViewer();

    const [showSettings, setShowSettings] = useState(false);
    const [gridVisible, setGridVisible] = useState(true);
    const [projection, setProjection] = useState<'Perspective' | 'Orthographic'>('Perspective');

    // ✅ Add guard clause
    if (!components || !world) return null;

    useEffect(() => {
        // ⛔ No need for guards, this runs after components/world are ready
        const grids = components.get(OBC.Grids);
        const worldGrid = grids.list.get(world.uuid);
        if (worldGrid) {
            setGridVisible(worldGrid.visible);
        }

        const updateProjection = () => {
            setProjection(world.camera.projection.current as 'Perspective' | 'Orthographic');
        };
        world.camera.projection.onChanged.add(updateProjection);

        return () => {
            // ✅ Add guard for Strict Mode cleanup
            if (world.isDisposed) return;
            world.camera.projection.onChanged.remove(updateProjection);
        };
    }, [components, world]); // ✅ Add dependencies

    const handleToggleGrid = () => {
        // ⛔ Remove: const world = viewerHandler.getWorld();
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const grids = components.get(OBC.Grids);
        const worldGrid = grids.list.get(world.uuid);
        if (worldGrid) {
            worldGrid.visible = !gridVisible;
            setGridVisible(worldGrid.visible);
        }
    };

    const handleProjectionChange = (newProjection: 'Perspective' | 'Orthographic') => {
        // ⛔ Remove: const world = viewerHandler.getWorld();
        world.camera.projection.set(newProjection);
        // ⛔ Remove: world.renderer.postproduction.updateCamera();
        setProjection(newProjection);
        setShowSettings(false);
    };

    // ... (Your JSX is correct)
    return (
        <div className="viewport-settings">
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn-settings"
                title="Viewport Settings"
            >
                ⚙️
            </button>

            {showSettings && (
                <div className="settings-menu">
                    <div className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={gridVisible}
                                onChange={handleToggleGrid}
                            />
                            Grid
                        </label>
                    </div>

                    <div className="setting-item">
                        <label>Camera Projection</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    value="Perspective"
                                    checked={projection === 'Perspective'}
                                    onChange={() => handleProjectionChange('Perspective')}
                                />
                                Perspective
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="Orthographic"
                                    checked={projection === 'Orthographic'}
                                    onChange={() => handleProjectionChange('Orthographic')}
                                />
                                Orthographic
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewportSettings;