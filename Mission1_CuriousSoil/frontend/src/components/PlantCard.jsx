import { Droplets, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// --- 1. IMAGE IMPORTS (Simulated Assets) ---
// NOTE: Ensure the path '../assets/' is correct relative to this file.
// If you put this file in the same directory as 'assets', change to './assets/'
import onion from '../assets/onion.jpg'; 
import tomato from '../assets/tomatee.jpg';
import mint from '../assets/mint.jpg'; 

// --- Configuration ---
// IMPORTANT: Replace with your actual backend URL.
const API_BASE_URL = 'http://127.0.0.1:5000/api/v1'; // Example local backend URL
const POLLING_INTERVAL_MS = 5000; // Update status every 5 seconds

// --- 2. PLANT CARD COMPONENT (Backend-Ready) ---

function PlantCard({ image, description, plantName, plantId }) {
  // --- Data & Status States (Connect to Backend) ---
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [waterLevel, setWaterLevel] = useState(null); // null indicates initial loading
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState(null);

  // --- UI States (Local to Front-end) ---
  const [isHovering, setIsHovering] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);

  // --- Backend Interaction Functions ---

  /** Fetches the plant status (water level and pump state) from the backend. */
  const fetchPlantStatus = async () => {
    if (waterLevel === null) setLoadingStatus(true); 
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/plants/${plantId}/status`);
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update local states with data from the backend
      setIsPumpOn(data.isPumpOn); 
      setWaterLevel(data.waterLevel);
      
    } catch (err) {
      console.error(`Error fetching status for ${plantName}:`, err);
      if (waterLevel === null) setError("⚠️ فشل في تحميل الحالة. يرجى التحقق من الاتصال."); 
    } finally {
      setLoadingStatus(false);
    }
  };

  /** Sends a command to the backend to change the pump state. */
  const updatePumpState = async (newState) => {
    setError(null);
    const oldState = isPumpOn;
    
    // 1. Optimistic UI Update
    setIsPumpOn(newState); 
    setIsButtonAnimating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/plants/${plantId}/pump`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });

      if (!response.ok) {
        // 2. Rollback on failure
        setIsPumpOn(oldState);
        throw new Error('Failed to update pump state.');
      }
      
    } catch (err) {
      console.error("Error updating pump state:", err);
      setError("❌ فشل في تحديث حالة المضخة!");
    } finally {
      setTimeout(() => setIsButtonAnimating(false), 200);
    }
  };

  // --- Polling Effect (Replaces Simulation) ---

  useEffect(() => {
    // Fetch status immediately on mount
    fetchPlantStatus();
    
    // Set up polling for continuous updates
    const pollingInterval = setInterval(fetchPlantStatus, POLLING_INTERVAL_MS); 

    // Cleanup function
    return () => clearInterval(pollingInterval);
  }, [plantId]); 

  // --- Styling and Computed Values ---
  
  const isWaterLow = waterLevel !== null && waterLevel < 20;

  // Memoize styles that depend on hover/state for performance
  const cardStyle = useMemo(() => ({
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: isHovering 
      ? '0 12px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px #16a34a22' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovering ? 'translateY(-4px)' : 'translateY(0)',
    display: 'flex',
    flexDirection: 'column',
    direction: 'rtl',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(45deg, #16a34a11, transparent)',
      opacity: isHovering ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }
  }), [isHovering]);

  // Styles that depend on pump state and animation
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
  
  const waterLevelContainerStyle = {
    width: '50px',
    backgroundColor: '#e2e8f0',
    borderRadius: '10px',
    position: 'relative',
    overflow: 'hidden',
    border: isWaterLow ? '2px solid #ef4444' : '2px solid #cbd5e1',
    minHeight: '120px',
    cursor: 'help',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '100%',
      background: 'linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%)',
      pointerEvents: 'none'
    }
  };

  const waterFillStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${waterLevel || 0}%`, 
    background: waterLevel > 50 
      ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)' 
      : waterLevel > 20 
        ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' 
        : 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: 'waterFlow 2s ease-in-out infinite',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '8px',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
      animation: 'shimmer 2s infinite linear'
    }
  };
  
  // Static Styles
  const topSectionStyle = { padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' };
  const mediaAndWaterContainerStyle = { display: 'flex', alignItems: 'flex-start', padding: '0.75rem 0.75rem 0.25rem 0.75rem', gap: '1rem' };
  const imageContainerStyle = { flex: 1, aspectRatio: '4/3', overflow: 'hidden', position: 'relative', borderRadius: '10px', backgroundColor: '#f3f4f6' };
  const imageStyle = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.35s ease, opacity 0.35s ease', transform: isHovering ? 'scale(1.03)' : 'scale(1)', opacity: isImageLoading ? 0 : 1, display: 'block' };
  const imageOverlayStyle = { position: 'absolute', right: '12px', bottom: '12px', backgroundColor: 'rgba(0,0,0,0.45)', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '17px', fontWeight: '700', lineHeight: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' };
  const waterLevelWrapperStyle = { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const descriptionStyle = { padding: '0.75rem', fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6, textAlign: 'center', borderTop: '1px solid #f3f4f6' };

  // --- Loading / Error Handling UI ---
  if (loadingStatus && waterLevel === null) {
      return (
          <div style={{...cardStyle, height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl'}}>
              <div style={{ width: 32, height: 32, border: '4px solid #e2e8f0', borderTop: '4px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ marginRight: '1rem', color: '#6b7280' }}>جاري تحميل بيانات {plantName}...</span>
          </div>
      );
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Error Message */}
      {error && (
        <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', textAlign: 'center', borderBottom: '1px solid #fca5a5' }}>
          {error}
        </div>
      )}

      {/* Top Section: Title and Pump Controls */}
      <div style={{
        ...topSectionStyle,
        background: 'linear-gradient(to left, rgba(22, 163, 74, 0.05), transparent)',
        borderBottom: '1px solid rgba(22, 163, 74, 0.1)',
        marginBottom: '0.5rem'
      }}>
        <div style={{ 
          fontWeight: '700', 
          fontSize: '1.1rem', 
          color: '#1f2937',
          position: 'relative',
          paddingBottom: '4px'
        }}>
          {plantName}
          <div style={{
            position: 'absolute',
            bottom: '-1px',
            right: '0',
            width: '40%',
            height: '2px',
            background: 'linear-gradient(to left, #16a34a, transparent)',
            transition: 'width 0.3s ease'
          }}/>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
          {/* STOP Button */}
          <button
            className="hover-scale"
            style={buttonStyle(!isPumpOn)}
            onClick={() => updatePumpState(false)}
            aria-label="إيقاف المضخة"
            disabled={isButtonAnimating || loadingStatus}
          >
            موقوف
          </button>
          {/* START Button */}
          <button
            className="hover-scale"
            style={buttonStyle(isPumpOn)}
            onClick={() => updatePumpState(true)}
            aria-label="تشغيل المضخة"
            disabled={isButtonAnimating || loadingStatus}
          >
            <Droplets 
              style={{ 
                width: '16px', 
                height: '16px', 
                marginRight: '4px',
                animation: isPumpOn ? 'pulse 1.5s infinite' : 'none'
              }} 
            />
            يعمل
          </button>
        </div>
      </div>
      
      {/* Status Section */}
      <div style={{ 
        padding: '0 0.75rem 0.5rem 0.75rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Pump Status Badge */}
        <div className="status-badge" style={{ 
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: isPumpOn 
            ? 'linear-gradient(45deg, #16a34a11, #16a34a22)'
            : 'linear-gradient(45deg, #64748b11, #64748b22)',
          border: `1px solid ${isPumpOn ? '#16a34a33' : '#64748b33'}`,
          color: isPumpOn ? '#16a34a' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isPumpOn ? '#16a34a' : '#64748b',
            animation: isPumpOn ? 'pulse 1.5s infinite' : 'none'
          }}/>
          حالة المضخة: {isPumpOn ? 'تعمل' : 'متوقفة'}
        </div>

        {/* Date Badge */}
        <div className="status-badge" style={{ 
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          direction: 'rtl',
          padding: '0.3rem 0.6rem',
          borderRadius: '6px',
          background: 'linear-gradient(45deg, #64748b08, #64748b11)',
          border: '1px solid #64748b22'
        }}>
          {(() => {
            const date = new Date();
            const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const arabicNumbers = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
            const toArabicNumber = (num) => num.toString().split('').map(digit => arabicNumbers[digit]).join('');
            return `${toArabicNumber(date.getDate())} ${months[date.getMonth()]} ${toArabicNumber(date.getFullYear())}`;
          })()}
        </div>
      </div>

      {/* Media and Water Level Container */}
      <div style={mediaAndWaterContainerStyle}>
        {/* Image Section */}
        <div style={imageContainerStyle}>
          {isImageLoading && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
             <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>}
          <img
            src={image}
            alt={plantName}
            style={imageStyle}
            loading="lazy"
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
          <div style={imageOverlayStyle}>
            {plantName}
          </div>
        </div>

        {/* Water Level Section */}
        <div style={waterLevelWrapperStyle}>
          <div
            style={waterLevelContainerStyle}
            title={`مستوى الماء: ${Math.round(waterLevel || 0)}%${isWaterLow ? ' - مستوى منخفض!' : ''}`}
          >
            <div style={waterFillStyle} />
            {isWaterLow && (
              <div style={{
                position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
                animation: 'pulse 2s infinite', zIndex: 20,
              }}>
                <AlertTriangle size={16} color="#ef4444" fill="#fee2e2" />
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1f2937', textAlign: 'center', marginTop: '0.4rem' }}>
            الماء: {waterLevel !== null ? `${Math.round(waterLevel)}٪` : '--'}
            {isWaterLow && (
              <span style={{ color: '#ef4444', marginRight: '4px' }}>⚠️</span>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div style={descriptionStyle}>
        {description}
      </div>
    </div>
  );
}

// --- 3. GARDEN DASHBOARD COMPONENT (Main Application View) ---

// Define the data for each plant
const plantData = [
  {
    plantId: 'tomato-101',
    plantName: 'طماطم تشيري',
    image: tomato,
    description: 'طماطم تشيري غنية بالفيتامينات وتتطلب تصريفاً جيداً للماء وضوء شمس كافيًا للنمو الأمثل.',
  },
  {
    plantId: 'mint-202',
    plantName: 'نعناع مغربي',
    image: mint,
    description: 'النعناع من النباتات التي تنمو بسرعة وتتطلب سقيًا منتظمًا للحفاظ على أوراقها العطرية الطازجة.',
  },
  {
    plantId: 'onion-303',
    plantName: 'بصل أخضر',
    image: onion,
    description: 'البصل الأخضر يحتاج إلى تربة رطبة باستمرار، وهو مثالي للزراعة المائية لسهولة التحكم في مستويات الرطوبة.',
  },
];

export default function GardenDashboard() {
  const dashboardStyle = {
    padding: '2rem',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl',
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#1f2937',
    fontSize: '2rem',
    fontWeight: '800',
    borderBottom: '3px solid #16a34a',
    display: 'inline-block',
    paddingBottom: '0.5rem',
  };

  const gridStyle = {
    display: 'grid',
    gap: '2rem',
    justifyContent: 'center',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  return (
    <div style={dashboardStyle}>
      <h1 style={titleStyle}>
        لوحة التحكم بالحديقة الذكية 🌿
      </h1>
      <div style={gridStyle}>
        {plantData.map((plant) => (
          <PlantCard
            key={plant.plantId}
            plantId={plant.plantId} // Passes unique ID to the card
            plantName={plant.plantName}
            image={plant.image}
            description={plant.description}
          />
        ))}
      </div>
      
      {/* Include CSS for the spinning loader and pulse animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 0.7; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes waterFlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .status-badge {
          animation: fadeIn 0.3s ease-out;
        }
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

