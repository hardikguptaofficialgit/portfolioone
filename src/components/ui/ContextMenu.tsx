import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';

export interface ContextMenuItem {
    label?: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    disabled?: boolean;
    separator?: boolean;
    danger?: boolean;
    submenu?: ContextMenuItem[];
    checked?: boolean;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    onClose: () => void;
    show: boolean;
}

interface SubmenuProps {
    items: ContextMenuItem[];
    parentRef: HTMLButtonElement;
    onClose: () => void;
}

const Submenu = ({ items, parentRef, onClose }: SubmenuProps) => {
    const submenuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!submenuRef.current || !parentRef) return;

        const parentRect = parentRef.getBoundingClientRect();
        const submenuRect = submenuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = parentRect.right + 5;
        let y = parentRect.top;

        // If submenu would go off right edge, show on left side
        if (x + submenuRect.width > viewportWidth) {
            x = parentRect.left - submenuRect.width - 5;
        }

        // If submenu would go off bottom, adjust upward
        if (y + submenuRect.height > viewportHeight) {
            y = viewportHeight - submenuRect.height - 10;
        }

        setPosition({ x, y });
    }, [parentRef]);

    return (
        <motion.div
            ref={submenuRef}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="fixed z-[10000] min-w-[180px] bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-1 overflow-hidden"
            style={{ left: position.x, top: position.y }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return (
                        <div
                            key={`separator-${index}`}
                            className="h-[1px] bg-white/5 my-1 mx-2"
                        />
                    );
                }

                return (
                    <motion.button
                        key={index}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        onClick={() => {
                            if (!item.disabled && item.onClick) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                        className={`
                            w-full px-3 py-2 text-left text-sm flex items-center gap-3
                            transition-colors
                            ${item.disabled
                                ? 'text-zinc-600 cursor-not-allowed'
                                : item.danger
                                    ? 'text-red-400 hover:text-red-300'
                                    : 'text-zinc-200 hover:text-white'
                            }
                        `}
                    >
                        {item.checked !== undefined && (
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                {item.checked && <Check className="w-3 h-3" />}
                            </div>
                        )}
                        {item.icon && !item.checked && (
                            <item.icon className="w-4 h-4 shrink-0" />
                        )}
                        <span className="flex-1">{item.label}</span>
                    </motion.button>
                );
            })}
        </motion.div>
    );
};

export const ContextMenu = ({ items, position, onClose, show }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [hoveredSubmenu, setHoveredSubmenu] = useState<number | null>(null);
    const [submenuButtonRef, setSubmenuButtonRef] = useState<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!show) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [show, onClose]);

    // Adjust position to keep menu within viewport
    useEffect(() => {
        if (!show || !menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = position.x;
        let adjustedY = position.y;

        // Adjust horizontal position
        if (rect.right > viewportWidth) {
            adjustedX = viewportWidth - rect.width - 10;
        }

        // Adjust vertical position
        if (rect.bottom > viewportHeight) {
            adjustedY = viewportHeight - rect.height - 10;
        }

        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
    }, [show, position]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="fixed z-[9999] min-w-[200px] bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-1 overflow-hidden"
                    style={{ left: position.x, top: position.y }}
                >
                    {items.map((item, index) => {
                        if (item.separator) {
                            return (
                                <div
                                    key={`separator-${index}`}
                                    className="h-[1px] bg-white/5 my-1 mx-2"
                                />
                            );
                        }

                        return (
                            <div
                                key={index}
                                className="relative"
                                onMouseEnter={() => {
                                    if (item.submenu) {
                                        setHoveredSubmenu(index);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (item.submenu) {
                                        setHoveredSubmenu(null);
                                    }
                                }}
                            >
                                <motion.button
                                    ref={(el) => {
                                        if (item.submenu && hoveredSubmenu === index) {
                                            setSubmenuButtonRef(el);
                                        }
                                    }}
                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    onClick={() => {
                                        if (!item.disabled && item.onClick && !item.submenu) {
                                            item.onClick();
                                            onClose();
                                        }
                                    }}
                                    disabled={item.disabled}
                                    className={`
                                        w-full px-3 py-2 text-left text-sm flex items-center gap-3
                                        transition-colors
                                        ${item.disabled
                                            ? 'text-zinc-600 cursor-not-allowed'
                                            : item.danger
                                                ? 'text-red-400 hover:text-red-300'
                                                : 'text-zinc-200 hover:text-white'
                                        }
                                    `}
                                >
                                    {item.checked !== undefined && (
                                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                            {item.checked && <Check className="w-3 h-3" />}
                                        </div>
                                    )}
                                    {item.icon && item.checked === undefined && (
                                        <item.icon className="w-4 h-4 shrink-0" />
                                    )}
                                    <span className="flex-1">{item.label}</span>
                                    {item.submenu && (
                                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    )}
                                </motion.button>

                                {/* Submenu */}
                                <AnimatePresence>
                                    {item.submenu && hoveredSubmenu === index && submenuButtonRef && (
                                        <Submenu
                                            items={item.submenu}
                                            parentRef={submenuButtonRef}
                                            onClose={onClose}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
