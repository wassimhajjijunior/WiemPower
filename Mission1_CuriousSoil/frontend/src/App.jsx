import React , { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import PlantCard from './components/PlantCard'

function App() {
  const [activeSection, setActiveSection] = useState('plants');
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-container" style={{
      minHeight: '100vh',
      background: `
        linear-gradient(120deg, rgba(219, 39, 119, 0.1), rgba(147, 51, 234, 0.1)),
        radial-gradient(circle at 100% 0%, rgba(219, 39, 119, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(219, 39, 119, 0.1)',
          animation: 'float 8s infinite ease-in-out',
          transform: `translateY(${scrollPosition * 0.2}px)`
        }} />
        <div style={{
          position: 'absolute',
          top: '40%',
          right: '10%',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'rgba(147, 51, 234, 0.1)',
          animation: 'float 10s infinite ease-in-out',
          animationDelay: '2s',
          transform: `translateY(${scrollPosition * 0.3}px)`
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '25px',
          height: '25px',
          borderRadius: '50%',
          background: 'rgba(219, 39, 119, 0.1)',
          animation: 'float 12s infinite ease-in-out',
          animationDelay: '4s',
          transform: `translateY(${scrollPosition * 0.1}px)`
        }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar onSectionChange={handleSectionChange} activeSection={activeSection} />
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <PlantCard/>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          .app-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: repeating-linear-gradient(
              45deg,
              rgba(219, 39, 119, 0.03) 0%,
              rgba(219, 39, 119, 0.03) 1px,
              transparent 1px,
              transparent 10px
            );
            pointer-events: none;
          }

          .app-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: repeating-linear-gradient(
              -45deg,
              rgba(147, 51, 234, 0.03) 0%,
              rgba(147, 51, 234, 0.03) 1px,
              transparent 1px,
              transparent 10px
            );
            pointer-events: none;
          }
        `}
      </style>
    </div>
  )
}

export default App
