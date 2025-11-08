// src/components/MeasurementTools.tsx
import React, { useState } from 'react';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';
// ✅ Import the hook
import { useViewer } from './ViewerContext';

const MeasurementTools: React.FC = () => {
    // ✅ Get components from the hook
    const { components } = useViewer();

    const [lengthEnabled, setLengthEnabled] = useState(false);
    const [areaEnabled, setAreaEnabled] = useState(false);
    const [clipperEnabled, setClipperEnabled] = useState(false);
    const [showMeasurementMenu, setShowMeasurementMenu] = useState(false);

    // ✅ Add guard clause
    if (!components) return null;

    const disableAll = (exceptions?: ('clipper' | 'length' | 'area')[]) => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const highlighter = components.get(OBF.Highlighter);
        const lengthMeasurer = components.get(OBF.LengthMeasurement);
        const areaMeasurer = components.get(OBF.AreaMeasurement);
        const clipper = components.get(OBC.Clipper);

        highlighter.clear('select');
        highlighter.enabled = false;

        if (!exceptions?.includes('length')) {
            lengthMeasurer.enabled = false;
            setLengthEnabled(false);
        }
        if (!exceptions?.includes('area')) {
            areaMeasurer.enabled = false;
            setAreaEnabled(false);
        }
        if (!exceptions?.includes('clipper')) {
            clipper.enabled = false;
            setClipperEnabled(false);
        }
    };

    const handleLengthMeasurement = () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const lengthMeasurer = components.get(OBF.LengthMeasurement);
        const highlighter = components.get(OBF.Highlighter);

        disableAll(['length']);
        const newState = !lengthEnabled;
        lengthMeasurer.enabled = newState;
        highlighter.enabled = !newState;
        setLengthEnabled(newState);
        setShowMeasurementMenu(false);
    };

    const handleAreaMeasurement = () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const areaMeasurer = components.get(OBF.AreaMeasurement);
        const highlighter = components.get(OBF.Highlighter);

        disableAll(['area']);
        const newState = !areaEnabled;
        areaMeasurer.enabled = newState;
        highlighter.enabled = !newState;
        setAreaEnabled(newState);
        setShowMeasurementMenu(false);
    };

    const handleModelSection = () => {
        // ⛔ Remove: const components = viewerHandler.getComponents();
        const clipper = components.get(OBC.Clipper);
        const highlighter = components.get(OBF.Highlighter);

        disableAll(['clipper']);
        const newState = !clipperEnabled;
        clipper.enabled = newState;
        highlighter.enabled = !newState;
        setClipperEnabled(newState);
    };

    const areMeasurementsEnabled = lengthEnabled || areaEnabled;

    // ... (Your JSX is correct)
    return (
        <div className="measurement-tools">
            <div className="tools-vertical">
                <div className="tool-with-menu">
                    <button
                        onClick={() => setShowMeasurementMenu(!showMeasurementMenu)}
                        className={`btn-tool ${areMeasurementsEnabled ? 'active' : ''}`}
                        title="Measurements"
                    >
                        📏
                    </button>
                    {showMeasurementMenu && (
                        <div className="tool-menu">
                            <button
                                onClick={handleLengthMeasurement}
                                className={`btn-menu ${lengthEnabled ? 'active' : ''}`}
                            >
                                Length
                            </button>
                            <button
                                onClick={handleAreaMeasurement}
                                className={`btn-menu ${areaEnabled ? 'active' : ''}`}
                            >
                                Area
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleModelSection}
                    className={`btn-tool ${clipperEnabled ? 'active' : ''}`}
                    title="Model Section"
                >
                    ✂️
                </button>
            </div>
        </div>
    );
};

export default MeasurementTools;