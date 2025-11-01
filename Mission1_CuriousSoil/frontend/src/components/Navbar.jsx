import { Leaf, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [activeButton, setActiveButton] = useState('plants');

  const navStyle = {
    background: '#16a34a',
    padding: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const containerStyle = {
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px'
  };

  const buttonStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    background: isActive ? 'white' : 'rgba(255, 255, 255, 0.9)',
    padding: '12px',
    border: '2px solid',
    borderColor: isActive ? '#16a34a' : 'transparent',
    borderRadius: '16px',
    boxShadow: isActive ? '0 8px 12px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    minWidth: '120px',
    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'all 0.3s ease'
  });

  const iconStyle = (isActive) => ({
    width: '32px',
    height: '32px',
    color: isActive ? '#16a34a' : '#666666',
    transition: 'all 0.3s ease'
  });

  const textStyle = (isActive) => ({
    fontSize: '18px',
    fontWeight: '700',
    color: isActive ? '#16a34a' : '#666666',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    direction: 'rtl'
  });

  return (
    <nav style={navStyle} role="navigation" aria-label="القائمة الرئيسية">
      <div style={containerStyle}>
        <button 
          style={buttonStyle(activeButton === 'plants')}
          onClick={() => setActiveButton('plants')}
          aria-pressed={activeButton === 'plants'}
          aria-label="النباتات"
        >
          <Leaf style={iconStyle(activeButton === 'plants')} />
          <div style={textStyle(activeButton === 'plants')}>النباتات</div>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            marginTop: '-4px'
          }}>🌿</div>
        </button>
        
        <button 
          style={buttonStyle(activeButton === 'schedule')}
          onClick={() => setActiveButton('schedule')}
          aria-pressed={activeButton === 'schedule'}
          aria-label="جدول الري"
        >
          <Calendar style={iconStyle(activeButton === 'schedule')} />
          <div style={textStyle(activeButton === 'schedule')}>جدول الري</div>
          <div style={{
            fontSize: '14px',
            color: '#666666',
            marginTop: '-4px'
          }}>📅</div>
        </button>
      </div>
    </nav>
  );
}