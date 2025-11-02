import { Leaf, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ onSectionChange, activeSection }) {

  const navStyle = {
    background: 'linear-gradient(135deg, #9333ea, #db2777)',
    padding: '16px',
    boxShadow: '0 4px 20px rgba(147, 51, 234, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 150%, rgba(219, 39, 119, 0.4) 0%, transparent 50%),
        radial-gradient(circle at 80% -50%, rgba(147, 51, 234, 0.4) 0%, transparent 50%)
      `,
      pointerEvents: 'none'
    },
    zIndex: 10
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
    }
  };

  const buttonStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    background: isActive 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(255, 255, 255, 0.1)',
    padding: '12px 24px',
    border: '2px solid',
    borderColor: isActive ? '#fff' : 'rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    boxShadow: isActive 
      ? '0 8px 20px rgba(219, 39, 119, 0.3), inset 0 0 20px rgba(147, 51, 234, 0.1)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    minWidth: '140px',
    transform: `translateY(${isActive ? '-2px' : '0'}) scale(${isActive ? '1.02' : '1'})`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: isActive 
        ? 'rgba(255, 255, 255, 0.98)' 
        : 'rgba(255, 255, 255, 0.15)',
      transform: `translateY(${isActive ? '-3px' : '-1px'}) scale(${isActive ? '1.03' : '1.01'})`,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
      transform: 'translateX(-100%)',
      transition: 'transform 0.6s',
    },
    '&:hover::before': {
      transform: 'translateX(100%)',
    }
  });

  const iconStyle = (isActive) => ({
    width: '32px',
    height: '32px',
    color: isActive ? '#db2777' : 'rgba(255, 255, 255, 0.9)',
    transition: 'all 0.3s ease',
    filter: isActive 
      ? 'drop-shadow(0 2px 4px rgba(219, 39, 119, 0.3))' 
      : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
    transform: 'scale(1)',
    '&:hover': {
      transform: 'scale(1.1) rotate(5deg)'
    }
  });

  const textStyle = (isActive) => ({
    fontSize: '18px',
    fontWeight: '700',
    color: isActive ? '#db2777' : 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    direction: 'rtl',
    textShadow: isActive 
      ? '0 1px 2px rgba(219, 39, 119, 0.2)' 
      : '0 1px 2px rgba(0, 0, 0, 0.1)',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease'
  });

  return (
    <nav style={navStyle} role="navigation" aria-label="القائمة الرئيسية">
      <div style={containerStyle}>
        <button 
          style={buttonStyle(activeSection === 'plants')}
          onClick={() => onSectionChange('plants')}
          aria-pressed={activeSection === 'plants'}
          aria-label="النباتات"
        >
          <Leaf style={iconStyle(activeSection === 'plants')} />
          <div style={textStyle(activeSection === 'plants')}>النباتات</div>
          <div style={{
            fontSize: '14px',
            color: activeSection === 'plants' ? '#ec4899' : '#9333ea',
            marginTop: '-4px',
            opacity: 0.9
          }}>🌿</div>
        </button>
        
        <button 
          style={buttonStyle(activeSection === 'schedule')}
          onClick={() => onSectionChange('schedule')}
          aria-pressed={activeSection === 'schedule'}
          aria-label="جدول الري"
        >
          <Calendar style={iconStyle(activeSection === 'schedule')} />
          <div style={textStyle(activeSection === 'schedule')}>جدول الري</div>
          <div style={{
            fontSize: '14px',
            color: activeSection === 'schedule' ? '#ec4899' : '#9333ea',
            marginTop: '-4px',
            opacity: 0.9
          }}>📅</div>
        </button>
      </div>
    </nav>
  );
}