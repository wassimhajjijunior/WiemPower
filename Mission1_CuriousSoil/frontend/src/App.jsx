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
        linear-gradient(120deg, #bac98de1 0%, #a2b983cc 100%),
        radial-gradient(circle at 100% 0%, #f1f5f9 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, #e5e7eb 0%, transparent 50%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
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
    </div>
  )
}

export default App
