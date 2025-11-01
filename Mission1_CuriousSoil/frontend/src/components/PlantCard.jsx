import { Droplets, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

function PlantCard({ image, description, plantName }) {
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [waterLevel, setWaterLevel] = useState(75);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaterLevel(prev => isPumpOn ? Math.min(prev + 2, 100) : Math.max(prev - 0.5, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPumpOn]);

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: isHovering ? '0 12px 24px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    transition: 'all 0.3s ease',
    transform: isHovering ? 'translateY(-4px)' : 'translateY(0)',
    display: 'flex',
    flexDirection: 'column',
  };

  const topSectionStyle = {
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.4rem',
    direction: 'rtl'
  };

  const buttonStyle = (isActive) => ({
    padding: '0.4rem 0.8rem',
    border: isActive ? 'none' : '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    backgroundColor: isActive ? (isPumpOn ? '#16a34a' : '#ef4444') : 'white',
    color: isActive ? 'white' : '#6b7280',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.3rem',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    transform: isButtonAnimating ? 'scale(0.95)' : 'scale(1)',
    opacity: isButtonAnimating ? 0.9 : 1
  });

  const imageContainerStyle = {
    width: '100%',
    aspectRatio: '16/9',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    transform: isHovering ? 'scale(1.05)' : 'scale(1)',
    opacity: isImageLoading ? 0 : 1
  };

  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f3f4f6',
    display: isImageLoading ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const descriptionStyle = {
    padding: '0.75rem',
    fontSize: '0.85rem',
    color: '#4b5563',
    lineHeight: 1.6,
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6',
    direction: 'rtl'
  };

  const waterLevelContainerStyle = {
    width: '50px',
    flex: '0 0 auto',
    backgroundColor: '#e2e8f0',
    borderRadius: '10px',
    position: 'relative',
    overflow: 'hidden',
    border: waterLevel < 20 ? '2px solid #ef4444' : '2px solid #cbd5e1',
    minHeight: '120px',
    margin: '0 auto 0.4rem',
    cursor: 'help'
  };

  const waterFillStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${waterLevel}%`,
    backgroundColor: waterLevel > 50 ? '#3b82f6' : waterLevel > 20 ? '#f59e0b' : '#ef4444',
    transition: 'all 0.5s ease'
  };

  const waterPercentageStyle = {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '0.4rem',
    direction: 'rtl'
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div style={topSectionStyle}>
        <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: isPumpOn ? '#dcfce7' : '#f1f5f9' }}>
          <Droplets style={{ width: '18px', height: '18px', color: isPumpOn ? '#16a34a' : '#64748b' }} />
        </div>
        <button 
          style={buttonStyle(!isPumpOn)} 
          onClick={() => {
            setIsPumpOn(false);
            setIsButtonAnimating(true);
            setTimeout(() => setIsButtonAnimating(false), 200);
          }}
          aria-label="إيقاف المضخة"
        >
          موقوف
        </button>
        <button 
          style={buttonStyle(isPumpOn)} 
          onClick={() => {
            setIsPumpOn(true);
            setIsButtonAnimating(true);
            setTimeout(() => setIsButtonAnimating(false), 200);
          }}
          aria-label="تشغيل المضخة"
        >
          يخدم
        </button>
      </div>

      <div style={imageContainerStyle}>
        <div style={loadingOverlayStyle}>
          <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <img 
          src={image} 
          alt={plantName} 
          style={imageStyle} 
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)}
        />
      </div>

      <div style={descriptionStyle}>
        <div style={{ fontWeight: '700', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{plantName}</div>
        {description}
      </div>

      <div 
        style={waterLevelContainerStyle}
        title={`مستوى الماء: ${Math.round(waterLevel)}%${waterLevel < 20 ? ' - مستوى منخفض!' : ''}`}
      >
        <div style={waterFillStyle} />
        {waterLevel < 20 && (
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'pulse 2s infinite'
          }}>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
        )}
      </div>
      <div style={waterPercentageStyle}>
        الماء: {Math.round(waterLevel)}٪
        {waterLevel < 20 && (
          <span style={{ color: '#ef4444', marginRight: '4px' }}>⚠️</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', justifyContent: 'center', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <PlantCard 
        plantName="الطماطم" 
        image="https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&q=80" 
        description="طماطم طازجة جاهزة للحصاد" 
      />
      <PlantCard 
        plantName="البصل" 
        image="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&q=80" 
        description="بصل عضوي ينمو بقوة" 
      />
      <PlantCard 
        plantName="النعناع" 
        image="https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=800&q=80" 
        description="نعناع عطري مثالي للشاي" 
      />
    </div>
  );
}