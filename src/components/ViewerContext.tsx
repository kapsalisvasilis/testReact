// src/components/ViewerContext.tsx

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBF from '@thatopen/components-front';

interface ViewerContextType {
    components: OBC.Components | null;
    world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null;
    isReady: boolean;
    initViewer: (container: HTMLDivElement) => Promise<void>;
    loadIfcModel: (file: File) => Promise<void>;
    loadFragModel: (file: File) => Promise<void>; // <-- ADDED THIS
}

const ViewerContext = createContext<ViewerContextType>({
    components: null,
    world: null,
    isReady: false,
    initViewer: async () => {},
    loadIfcModel: async () => {},
    loadFragModel: async () => {} // <-- ADDED THIS
});

export const useViewer = () => useContext(ViewerContext);

export const ViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [components, setComponents] = useState<OBC.Components | null>(null);
    const [world, setWorld] = useState<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null>(null);
    const [isReady, setIsReady] = useState(false);

    const isInitializing = useRef(false);
    const eventListeners = useRef<{ [key: string]: (event: any) => void }>({});

    const initViewer = useCallback(async (container: HTMLDivElement) => {
        if (isInitializing.current || isReady) return;
        isInitializing.current = true;

        console.log("Initializing viewer...");

        const comps = new OBC.Components();
        const worlds = comps.get(OBC.Worlds);

        const newWorld = worlds.create<
            OBC.SimpleScene,
            OBC.OrthoPerspectiveCamera,
            OBC.SimpleRenderer
        >();

        newWorld.name = 'Main';
        newWorld.scene = new OBC.SimpleScene(comps);
        newWorld.scene.setup();
        newWorld.scene.three.background = new THREE.Color(0x1a1d23);
        newWorld.renderer = new OBC.SimpleRenderer(comps, container);
        newWorld.camera = new OBC.OrthoPerspectiveCamera(comps);
        newWorld.camera.threePersp.near = 0.01;
        newWorld.camera.threePersp.far = 1000;
        newWorld.camera.threePersp.updateProjectionMatrix();
        newWorld.camera.controls.restThreshold = 0.05;
        newWorld.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
        newWorld.dynamicAnchor = false;

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        comps.init();

        new OBC.FragmentsManager(comps);
        new OBC.IfcLoader(comps);
        new OBC.Hider(comps);
        new OBC.Clipper(comps);
        new OBF.Highlighter(comps);
        new OBF.LengthMeasurement(comps);
        new OBF.AreaMeasurement(comps);
        new OBC.Grids(comps);
        new OBC.Raycasters(comps);

        comps.get(OBC.Grids).create(newWorld);
        comps.get(OBC.Raycasters).get(newWorld);

        const fragments = comps.get(OBC.FragmentsManager);
        await fragments.init('/node_modules/@thatopen/fragments/dist/Worker/worker.mjs');

        fragments.core.models.materials.list.onItemSet.add(() => {});

        newWorld.camera.projection.onChanged.add(() => {
            for (const [_, model] of fragments.list) {
                model.useCamera(newWorld.camera.three);
            }
        });

        newWorld.camera.controls.addEventListener('rest', () => {
            fragments.core.update(true);
        });

        fragments.list.onItemSet.add(async ({ value: model }) => {
            console.log('Model added:', (model as any).name);
            model.useCamera(newWorld.camera.three);

            model.getClippingPlanesEvent = () => {
                return newWorld.renderer!.clippingPlanes || [];
            };
            newWorld.scene.three.add(model.object);

            try {
                const bbox = (model as any).boundingBox;
                if (bbox) {
                    const sphere = new THREE.Sphere();
                    bbox.getBoundingSphere(sphere);
                    await newWorld.camera.controls.fitToSphere(sphere, true);
                }
            } catch (error) {
                console.warn('Camera fit failed:', error);
            }
            await fragments.core.update(true);
        });

        const ifcLoader = comps.get(OBC.IfcLoader);
        await ifcLoader.setup({
            autoSetWasm: false,
            wasm: {
                absolute: true,
                path: 'https://unpkg.com/web-ifc@0.0.72/'
            },
        });

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

        const lengthMeasurer = comps.get(OBF.LengthMeasurement);
        lengthMeasurer.world = newWorld;
        lengthMeasurer.color = new THREE.Color('#6528d7');

        lengthMeasurer.list.onItemAdded.add((line: any) => {
            const center = new THREE.Vector3();
            line.getCenter(center);
            const radius = line.distance() / 3;
            const sphere = new THREE.Sphere(center, radius);
            newWorld.camera.controls.fitToSphere(sphere, true).catch(console.error);
        });

        const areaMeasurer = comps.get(OBF.AreaMeasurement);
        areaMeasurer.world = newWorld;
        areaMeasurer.color = new THREE.Color('#6528d7');

        areaMeasurer.list.onItemAdded.add((area: any) => {
            if (!area.boundingBox) return;
            const sphere = new THREE.Sphere();
            area.boundingBox.getBoundingSphere(sphere);
            newWorld.camera.controls.fitToSphere(sphere, true).catch(console.error);
        });

        eventListeners.current['handleResize'] = () => {
            newWorld.renderer?.resize();
            newWorld.camera.updateAspect();
        };

        eventListeners.current['handleKeydown'] = (event: KeyboardEvent) => {
            if (event.code === 'Delete' || event.code === 'Backspace') {
                comps.get(OBC.Clipper).delete(newWorld).catch(console.error);
                comps.get(OBF.LengthMeasurement).delete();
            }
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                comps.get(OBF.AreaMeasurement).endCreation();
            }
        };

        eventListeners.current['handleDoubleClick'] = () => {
            const clipper = comps.get(OBC.Clipper);
            if (clipper.enabled) {
                clipper.create(newWorld).catch(console.error);
            }
        };

        globalThis.addEventListener('resize', eventListeners.current['handleResize']);
        globalThis.addEventListener('keydown', eventListeners.current['handleKeydown']);

        newWorld.renderer.three.domElement.addEventListener(
            'dblclick',
            eventListeners.current['handleDoubleClick']
        );

        setComponents(comps);
        setWorld(newWorld);
        setIsReady(true);
        isInitializing.current = false;
        console.log("Viewer is ready!");
    }, [isReady]);

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

    // --- NEW FUNCTION ---
    // This loads a .frag file, which is what your
    // ProjectSelection component now provides.
    const loadFragModel = useCallback(async (file: File) => {
        if (!components) return;
        const fragments = components.get(OBC.FragmentsManager);
        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            await fragments.load(bytes); // Use the FragmentsManager to load
        } catch (error) {
            console.error('Error loading .frag file:', error);
        }
    }, [components]);
    // --- END NEW FUNCTION ---

    useEffect(() => {
        return () => {
            if (world) {
                globalThis.removeEventListener('resize', eventListeners.current['handleResize']);
                globalThis.removeEventListener('keydown', eventListeners.current['handleKeydown']);
                world.renderer?.three.domElement.removeEventListener(
                    'dblclick',
                    eventListeners.current['handleDoubleClick']
                );
                world.dispose();
            }
        };
    }, [world]);

    const value = {
        components,
        world,
        isReady,
        initViewer,
        loadIfcModel,
        loadFragModel // <-- ADDED THIS
    };

    return (
        <ViewerContext.Provider value={value}>
            {children}
        </ViewerContext.Provider>
    );
};