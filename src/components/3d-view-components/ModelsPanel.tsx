// src/components/ModelsPanel.tsx
import React, { useState, useEffect } from 'react';
import * as OBC from '@thatopen/components';
import { useViewer } from './ViewerContext.tsx';

interface Model {
    uuid: string;
    name: string;
}

const ModelsPanel: React.FC = () => {
    const [models, setModels] = useState<Model[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { components, loadIfcModel } = useViewer();

    useEffect(() => {
        if (!components) return;

        const fragments = components.get(OBC.FragmentsManager);
        const updateModels = () => {
            const modelsList: Model[] = [];
            for (const [uuid, model] of fragments.list) {
                modelsList.push({
                    uuid,
                    // ✅ Fix: Use (model as any) to access 'name'
                    name: (model as any).name || 'Unnamed Model',
                });
            }
            setModels(modelsList);
        };

        fragments.list.onItemSet.add(updateModels);
        fragments.list.onItemDeleted.add(updateModels);
        updateModels();

        return () => {
            // ✅ Add guard for Strict Mode cleanup
            if (fragments.isDisposed) return;
            fragments.list.onItemSet.remove(updateModels);
            fragments.list.onItemDeleted.remove(updateModels);
        };
    }, [components]);

    const handleAddIfcModel = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = false;
        input.accept = '.ifc';

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            // ✅ Add check for loadIfcModel
            if (!file || !loadIfcModel) return;

            setLoading(true);
            try {
                await loadIfcModel(file);
            } catch (error) {
                console.error('Error loading IFC file:', error);
            } finally {
                setLoading(false);
            }
        });

        input.click();
    };

    const handleDeleteModel = async (uuid: string) => {
        if (!components) return;
        const fragments = components.get(OBC.FragmentsManager);
        await fragments.list.delete(uuid);
    };

    const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ... (Your JSX is correct)
    return (
        <div className="models-panel">
            <div className="panel-header">
                <h3>📦 Models</h3>
            </div>

            <div className="panel-controls">
                <input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button
                    onClick={handleAddIfcModel}
                    disabled={loading || !components}
                    className="btn-primary"
                    title="Add IFC Model"
                >
                    {loading ? '⏳' : '➕'}
                </button>
            </div>

            <div className="models-list">
                {filteredModels.length === 0 ? (
                    <div className="empty-state">
                        {searchQuery ? 'No models match your search' : 'No models loaded'}
                    </div>
                ) : (
                    filteredModels.map((model) => (
                        <div key={model.uuid} className="model-item">
                            <span className="model-name">{model.name}</span>
                            <button
                                onClick={() => handleDeleteModel(model.uuid)}
                                className="btn-delete"
                                title="Delete Model"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ModelsPanel;