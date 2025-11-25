import { useState, useCallback } from 'react';

interface ContextMenuState {
    show: boolean;
    position: { x: number; y: number };
}

export const useContextMenu = () => {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        show: false,
        position: { x: 0, y: 0 },
    });

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            show: true,
            position: { x: e.clientX, y: e.clientY },
        });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu((prev) => ({ ...prev, show: false }));
    }, []);

    return {
        contextMenu,
        handleContextMenu,
        closeContextMenu,
    };
};
