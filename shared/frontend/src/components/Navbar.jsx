import { Leaf, Calendar, Settings, Info } from 'lucide-react';
import { useState } from 'react';

// NOTE: We must remove all pseudo-selectors (&::before, &:hover, etc.)
// and manage hover states using React's useState hook for each button.

export default function Navbar({ onSectionChange, activeSection }) {

    const navItems = [
        { id: 'scheduler', label: 'جدول الري', icon: Calendar, emoji: '💧' },
        { id: 'settings', label: 'الإعدادات', icon: Settings, emoji: '⚙️' },
        { id: 'about', label: 'حول التطبيق', icon: Info, emoji: 'ℹ️' },
    ];

    // State to track which button is currently hovered
    const [hoveredId, setHoveredId] = useState(null);

    // --- Inline Styles (Cleaned up) ---
    const navStyle = {
        background: 'transparent',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 20
    };

    const containerStyle = {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
    };

    const buttonStyle = (isActive, isHovered) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        // Dynamic background based on active or hover state
        background: isActive 
            ? 'rgba(255, 255, 255, 0.95)' 
            : (isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
        padding: '12px 12px',
        border: '2px solid',
        borderColor: isActive ? '#16a34a' : (isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'),
        borderRadius: '20px',
        cursor: 'pointer',
        minWidth: '90px',
        // Dynamic transform based on active or hover state
        transform: `translateY(${isActive || isHovered ? '-2px' : '0'}) scale(${isActive || isHovered ? '1.02' : '1'})`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        // Removed non-functional '::before' logic
    });

    const iconStyle = (isActive) => ({
        width: '25px',
        height: '25px',
        color: isActive ? '#15803d' : 'rgba(255, 255, 255, 0.9)', 
        transition: 'all 0.3s ease',
        filter: isActive 
            ? 'drop-shadow(0 2px 4px rgba(22, 163, 74, 0.4))' 
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
        transform: 'scale(1)',
        // Removed non-functional ':hover' logic
    });

    const textStyle = (isActive) => ({
        fontSize: '16px',
        fontWeight: '700',
        color: isActive ? '#15803d' : 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Cairo, sans-serif',
        textAlign: 'center',
        direction: 'rtl',
        textShadow: isActive 
            ? '0 1px 2px rgba(22, 163, 74, 0.2)' 
            : '0 1px 2px rgba(0, 0, 0, 0.1)',
        letterSpacing: '0.5px',
        transition: 'all 0.3s ease'
    });

    const emojiStyle = (isActive) => ({
        fontSize: '14px',
        color: isActive ? '#16a34a' : '#fff',
        marginTop: '-4px',
        opacity: 0.9
    });


    return (
        <nav style={navStyle} role="navigation" aria-label="القائمة الرئيسية">
            <div style={containerStyle}>
                {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    const isHovered = hoveredId === item.id;
                    const IconComponent = item.icon;

                    return (
                        <button 
                            key={item.id}
                            style={buttonStyle(isActive, isHovered)}
                            onClick={() => onSectionChange(item.id)}
                            // Use onMouseEnter and onMouseLeave to manage hover state in React
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            aria-pressed={isActive}
                            aria-label={item.label}
                        >
                            <IconComponent style={iconStyle(isActive)} />
                            <div style={textStyle(isActive)}>{item.label}</div>
                            <div style={emojiStyle(isActive)}>{item.emoji}</div>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}