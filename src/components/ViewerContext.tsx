// src/components/ViewerContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';

// ⛔ DO NOT import useViewer from here
// ⛔ DO NOT call useViewer() at the top level

interface ViewerContextType {
    components: OBC.Components | null;
    // ✅ Changed to SimpleRenderer
    world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null;
    isReady: boolean;
    initViewer: (container: HTMLDivElement) => Promise<void>;
    loadIfcModel: (file: File) => Promise<void>;
}

const ViewerContext = createContext<ViewerContextType>({
    components: null,
    world: null,
    isReady: false,
    initViewer: async () => {},
    loadIfcModel: async () => {}
});

export const useViewer = () => useContext(ViewerContext);

export const ViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [components, setComponents] = useState<OBC.Components | null>(null);
    const [world, setWorld] = useState<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null>(null);
    const [isReady, setIsReady] = useState(false);

    // ✅ Add ref to prevent double-init in Strict Mode
    const isInitializing = useRef(false);

    const initViewer = useCallback(async (container: HTMLDivElement) => {
        // ✅ Guard against Strict Mode
        if (isInitializing.current || isReady) return;
        isInitializing.current = true;

        console.log("Initializing viewer...");

        const comps = new OBC.Components();
        const worlds = comps.get(OBC.Worlds);

        const newWorld = worlds.create<
            OBC.SimpleScene,
            OBC.OrthoPerspectiveCamera,
            OBC.SimpleRenderer // ✅ Use SimpleRenderer
        >();

        // Basic setup
        newWorld.scene = new OBC.SimpleScene(comps);
        newWorld.scene.setup();
        newWorld.scene.three.background = new THREE.Color(0x1a1d23);

        newWorld.renderer = new OBC.SimpleRenderer(comps, container); // ✅ Use SimpleRenderer
        newWorld.camera = new OBC.OrthoPerspectiveCamera(comps);

        // ✅ Initialize components system first
        await comps.init();

        // ✅ Now instantiate and register components
        new OBC.FragmentsManager(comps);
        new OBC.IfcLoader(comps);
        new OBC.Hider(comps);
        new OBC.Clipper(comps);
        new OBF.Highlighter(comps);
        new OBF.LengthMeasurement(comps);
        new OBF.AreaMeasurement(comps);
        new OBC.Grids(comps);
        new OBC.Raycasters(comps);

        // Setup grids and raycasters
        comps.get(OBC.Grids).create(newWorld);
        comps.get(OBC.Raycasters).get(newWorld);

        // Setup IFC loader
        const ifcLoader = comps.get(OBC.IfcLoader);
        await ifcLoader.setup({
            autoSetWasm: false,
            wasm: {
                absolute: true,
                path: 'https://unpkg.com/web-ifc@0.0.71/'
            },
        });

        // Setup fragments
        const fragments = comps.get(OBC.FragmentsManager);
        await fragments.init('/node_modules/@thatopen/fragments/dist/Worker/worker.mjs');

        // Setup highlighter
        const highlighter = comps.get(OBF.Highlighter);
        highlighter.setup({
            world: newWorld,
            selectMaterialDefinition: {
                color: new THREE.Color('#bcf124'),
                renderedFaces: 1,
                opacity: 1,
                transparent: false,
            },
        });

        // Setup measurement tools
        const lengthMeasurer = comps.get(OBF.LengthMeasurement);
        lengthMeasurer.world = newWorld;
        lengthMeasurer.color = new THREE.Color('#6528d7');

        const areaMeasurer = comps.get(OBF.AreaMeasurement);
        areaMeasurer.world = newWorld;
        areaMeasurer.color = new THREE.Color('#6528d7');

        setComponents(comps);
        setWorld(newWorld);
        setIsReady(true);
        isInitializing.current = false;
        console.log("Viewer is ready!");
    }, [isReady]); // ✅ Add isReady dependency

    const loadIfcModel = useCallback(async (file: File) => {
        if (!components || !world) return;

        const ifcLoader = components.get(OBC.IfcLoader);
        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            await ifcLoader.load(bytes, true, file.name.replace('.ifc', ''));
        } catch (error) {
            console.error('Error loading IFC file:', error);
        }
    }, [components, world]);

    const value = {
        components,
        world,
        isReady,
        initViewer,
        loadIfcModel
    };

    return (
        <ViewerContext.Provider value={value}>
            {children}
        </ViewerContext.Provider>
    );
};