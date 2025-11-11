// BimViewer.tsx
import React, { useEffect, useRef } from 'react';
import { useViewer } from '../../components/3d-view-components/ViewerContext.tsx';


const BIMViewer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { initViewer, isReady } = useViewer();

    useEffect(() => {
        if (containerRef.current && !isReady) {
            initViewer(containerRef.current);
        }
    }, [initViewer, isReady]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        />
    );
};

export default BIMViewer;