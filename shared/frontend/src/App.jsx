import React, { useState, useEffect } from 'react';
// Assuming Navbar is located in a components directory:
import Navbar from './components/Navbar'; 
import { Leaf, Droplet, Calendar, Sun, CloudRain, Settings, Info } from 'lucide-react'; 

// --- CONSTANTS & MOCK DATA ---
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tunisianDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const MOCK_FORECASTS_DATA = [
    {
        plantId: 'TOMATE-001-AREA-A',
        plantName: 'طماطم (القطعة أ)', // Tomate
        color: '#ef4444', 
        soilDeficit: 0.20, 
        schedule: [
            { day: 'Sun', date: '20/10', rain_mm: 0, etc_mm: 5.0, needed_mm: 5.0 },
            { day: 'Mon', date: '21/10', rain_mm: 0, etc_mm: 5.5, needed_mm: 5.5 },
            // Setting today's day dynamically for the highlight
            { day: daysOfWeek[new Date().getDay()], date: '22/10', rain_mm: 3.0, etc_mm: 5.2, needed_mm: 2.2 }, 
            { day: 'Wed', date: '23/10', rain_mm: 0, etc_mm: 6.0, needed_mm: 6.0 }, 
            { day: 'Thu', date: '24/10', rain_mm: 0, etc_mm: 6.5, needed_mm: 6.5 },
            { day: 'Fri', date: '25/10', rain_mm: 0, etc_mm: 5.8, needed_mm: 5.8 },
            { day: 'Sat', date: '26/10', rain_mm: 0, etc_mm: 5.1, needed_mm: 5.1 },
        ]
    },
    {
        plantId: 'ONION-002-AREA-B',
        plantName: 'بصل (القطعة ب)', // Onion
        color: '#f97316', 
        soilDeficit: 0.08, 
        schedule: [
            { day: 'Sun', date: '20/10', rain_mm: 0, etc_mm: 2.1, needed_mm: 2.1 },
            { day: 'Mon', date: '21/10', rain_mm: 0, etc_mm: 2.5, needed_mm: 2.5 },
            { day: 'Tue', date: '22/10', rain_mm: 0, etc_mm: 2.3, needed_mm: 2.3 }, 
            { day: 'Wed', date: '23/10', rain_mm: 5.0, etc_mm: 2.8, needed_mm: 0 }, 
            { day: 'Thu', date: '24/10', rain_mm: 0, etc_mm: 3.0, needed_mm: 3.0 },
            { day: 'Fri', date: '25/10', rain_mm: 0, etc_mm: 2.7, needed_mm: 2.7 },
            { day: 'Sat', date: '26/10', rain_mm: 0, etc_mm: 2.2, needed_mm: 2.2 },
        ]
    },
    {
        plantId: 'MINT-003-FIELD-C',
        plantName: 'نعناع (المزرعة)', // Mint
        color: '#10b981', 
        soilDeficit: 0.10, 
        schedule: [
            { day: 'Sun', date: '20/10', rain_mm: 0, etc_mm: 3.2, needed_mm: 3.2 },
            { day: 'Mon', date: '21/10', rain_mm: 0, etc_mm: 3.5, needed_mm: 3.5 },
            { day: 'Tue', date: '22/10', rain_mm: 0, etc_mm: 3.1, needed_mm: 3.1 }, 
            { day: 'Wed', date: '23/10', rain_mm: 0, etc_mm: 3.7, needed_mm: 3.7 },
            { day: 'Thu', date: '24/10', rain_mm: 0, etc_mm: 3.9, needed_mm: 3.9 },
            { day: 'Fri', date: '25/10', rain_mm: 0, etc_mm: 3.6, needed_mm: 3.6 },
            { day: 'Sat', date: '26/10', rain_mm: 0, etc_mm: 3.3, needed_mm: 3.3 },
        ]
    }
];


// --- Sub-Component for a Single Day's Schedule ---
const DailyScheduleItem = ({ day, date, rain_mm, etc_mm, needed_mm, isSelected, onSelect }) => {
    const todayIndex = new Date().getDay();
    const isToday = day === daysOfWeek[todayIndex]; 
    const tunisianDay = tunisianDays[daysOfWeek.indexOf(day)];

    let neededStyle = { color: '#16a34a', fontWeight: '700' };
    let neededIcon = <Droplet className="icon-animate" style={{width:'20px',height:'20px',marginLeft:'8px'}} />;
    let neededText = `${needed_mm.toFixed(1)} ملم ماء`;

    if (needed_mm > 5.0) { 
        neededStyle = { color: '#2563eb', fontWeight: 'bold' };
        neededText = 'ماء كثير جداً';
    } else if (needed_mm === 0) {
        neededStyle = { color: '#d97706', fontWeight: 'bold' }; 
        neededIcon = <Sun style={{width:'20px',height:'20px',marginLeft:'8px'}} />;
        neededText = 'لا حاجة للماء';
    }

    return (
        <div 
            className={`daily-item ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
        > 
            <div className="daily-item-content">
                <div className={`day-info ${isToday ? 'day-info-today' : 'day-info-default'}`}> 
                    <span>{tunisianDay} {isToday && ' (اليوم)'}</span>
                    <span className="date-text">{date}</span>
                </div>
                <div className="forecast-details">
                    <span className="forecast-item tooltip-container">
                        <CloudRain className="icon-animate" style={{width:'16px',height:'16px',marginLeft:'6px'}} />
                        {rain_mm} ملم مطر
                        <span className="tooltip">كمية المطر المتوقعة</span>
                    </span>
                    <span className="forecast-item hidden-sm tooltip-container">
                        <Leaf className="icon-animate" style={{width:'16px',height:'16px',marginLeft:'6px'}} />
                        احتياج النبات: {etc_mm.toFixed(1)} ملم
                        <span className="tooltip">معدل التبخر والنتح</span>
                    </span>
                    <div className="recommendation-box tooltip-container" style={neededStyle}>
                        {neededIcon}
                        <span className="recommendation-text">{neededText}</span>
                        <span className="tooltip">كمية الري المطلوبة</span>
                    </div>
                </div>
                {isSelected && (
                    <div className="details-panel">
                        <div className="details-content">
                            <h4>تفاصيل الري ليوم {tunisianDay}</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">المطر المتوقع</span>
                                    <span className="detail-value">{rain_mm} ملم</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">احتياج النبات</span>
                                    <span className="detail-value">{etc_mm.toFixed(1)} ملم</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">كمية الري</span>
                                    <span className="detail-value">{needed_mm.toFixed(1)} ملم</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Plant Card Component ---
const PlantScheduleCard = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const totalWater = data.schedule.map(item => item.needed_mm).reduce((sum, val) => sum + val, 0).toFixed(1);

    const toggleExpand = (e) => {
        if (e.target.closest('.daily-item') === null) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleDayClick = (day) => {
        setSelectedDay(selectedDay === day ? null : day);
    };

    return (
        <div className={`plant-card ${isExpanded ? 'expanded' : ''}`} 
              onClick={toggleExpand}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}>
            <div className="card-header" style={{ backgroundColor: data.color, color: 'white' }}>
                <Leaf className="card-icon" style={{width:'32px',height:'32px',marginLeft:'1rem'}} />
                <div className="header-text">
                    <h2 className="header-title">{data.plantName}</h2>
                    <p className="header-subtitle">{data.plantId}</p>
                </div>
                <div className="expand-indicator"></div>
            </div>
            
            <div className="summary-stats">
                <div className="stat-item">
                    <span className="stat-label">العجز الحالي</span>
                    <span className="stat-value red-text">
                        {(data.soilDeficit * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="stat-item border-left">
                    <span className="stat-label">إجمالي الماء هذا الأسبوع</span>
                    <span className="stat-value blue-text">
                        {totalWater} ملم
                    </span>
                </div>
            </div>

            <div className="schedule-detail">
                <h3 className="schedule-title-text">
                    <Calendar style={{width:'20px',height:'20px',marginLeft:'0.5rem'}} />
                    خطة الري لـ 7 أيام
                </h3>
                <div className="schedule-list">
                    {data.schedule.map((item, index) => (
                        <DailyScheduleItem 
                            key={index} 
                            {...item} 
                            isSelected={selectedDay === item.day} 
                            onSelect={() => handleDayClick(item.day)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Plant Scheduler View Component ---
const PlantScheduler = () => {
    const [forecasts, setForecasts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        
        const mockFetch = setTimeout(() => {
            setForecasts(MOCK_FORECASTS_DATA);
            setLoading(false);
        }, 1500);

        return () => clearTimeout(mockFetch);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-card">
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="loading-text">جاري تحميل البيانات التجريبية...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="header-style">
                <div className="header-content">
                    <Droplet className="header-icon" style={{width:'32px',height:'32px',marginLeft:'0.5rem'}} />
                    <h1 style={{fontSize: '2rem', fontWeight: '800'}}>جدول الري التونسي الذكي</h1>
                </div>
            </header>

            <main className="main-content">
                <div className="info-box" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '700', color: '#15803d' }}>مرحبا بكم في نظام الري الذكي! 👋</span>
                    </div>
                    هنا تجد جداول الري المقترحة لنباتاتك (**طماطم، بصل، نعناع**).
                    <ul style={{ paddingRight: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <li>الأيام المظللة بالأخضر تمثل اليوم الحالي</li>
                        <li>اللون الأزرق يعني حاجة عالية للري</li>
                        <li>اللون البرتقالي يعني لا حاجة للري</li>
                    </ul>
                </div>

                {forecasts.length === 0 ? (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#4b5563'}}>
                        <p style={{fontSize: '1.2rem'}}>لا توجد جداول نباتية حاليًا.</p>
                    </div>
                ) : (
                    forecasts.map((plantData) => (
                        <PlantScheduleCard key={plantData.plantId} data={plantData} />
                    ))
                )}
                
                <div style={{gridColumn: '1 / -1', marginTop: '1rem', padding: '1.5rem', borderTop: '2px solid #16a34a', fontSize: '0.9rem', color: '#374151', fontWeight: '600', textAlign: 'center'}}>
                    مصدر البيانات: **بيانات تجريبية مُعدّة للعرض**.
                </div>
            </main>
        </>
    );
};


// --- Placeholder Content Views ---
const PlaceholderContent = ({ section }) => (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', color: '#374151', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#16a34a' }}>
            {section === 'about' ? '🌱 حول التطبيق' : '⚙️ إعداداتي'}
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
            هذه واجهة عرض للمحتوى الخاص بقسم **{section === 'about' ? 'المعلومات' : 'الإعدادات'}**.
        </p>
        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
            يمكنك استبدال هذا المكون بمحتوى حقيقي يسمح للمستخدمين بتعديل إعدادات الحقول أو قراءة المزيد عن المشروع.
        </p>
    </div>
);


// --- Full CSS Styles ---
const styleSheet = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
    
    * {
        box-sizing: border-box;
        transition: all 0.2s ease-in-out;
    }

    body {
        margin: 0;
        background: #f8fafc;
    }

    .app-container {
        min-height: 100vh;
        background: linear-gradient(120deg, #bac98de1 0%, #a2b983cc 100%),
                    radial-gradient(circle at 100% 0%, #f1f5f9 0%, transparent 50%),
                    radial-gradient(circle at 0% 100%, #e5e7eb 0%, transparent 50%);
        font-family: 'Cairo', 'Arial', ui-sans-serif, system-ui, sans-serif;
        position: relative;
        direction: rtl; 
        padding-bottom: 3rem;
    }
    .header-style {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(22, 163, 74, 0.95);
        color: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        padding: 1.25rem 1rem;
        backdrop-filter: blur(8px);
        border-bottom: 3px solid #15803d;
        font-size: 1.8rem;
        text-align: center;
    }
    .header-content {
        max-width: 56rem;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }
    .header-icon {
        animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
    }

    .main-content {
        max-width: 60rem; 
        margin: 0 auto;
        padding: 2.5rem 1.5rem 5rem 1.5rem;
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(1, 1fr);
    }
    @media (min-width: 768px) {
        .main-content {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (min-width: 1024px) {
        .main-content {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    .info-box {
        grid-column: 1 / -1; 
        margin-bottom: 1rem;
        color: #14532d;
        border-right: 6px solid #16a34a; 
        padding: 1rem 1.5rem 1rem 0.75rem;
        background: rgba(255,255,255,0.95);
        border-radius: 0.75rem;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(22,163,74,0.1);
        text-align: right;
        line-height: 1.8;
    }

    .plant-card {
        background: rgba(255,255,255,0.98);
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        border-radius: 1.25rem;
        overflow: hidden;
        border: 1px solid rgba(229,231,235,0.7);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        cursor: pointer;
    }
    .plant-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 30px rgba(22,163,74,0.15);
        border-color: rgba(22,163,74,0.3);
    }
    .card-header {
        padding: 1.5rem 1rem;
        display: flex;
        align-items: center;
        color: #fff;
    }
    .summary-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        text-align: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }
    .border-left {
        border-right: 1px solid #e5e7eb; 
    }
    .red-text { color: #dc2626; } 
    .blue-text { color: #2563eb; } 
    .schedule-detail {
        padding: 0.5rem;
        flex-grow: 1;
    }
    .schedule-title-text {
        display: flex;
        align-items: center;
        font-weight: 700;
        margin: 0.5rem 0.5rem 0.5rem 0.5rem;
    }
    .schedule-list {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        display: flex;
        flex-direction: column;
        background: white;
    }
    .daily-item {
        padding: 1rem;
        border-bottom: 1px solid #f3f4f6;
        position: relative;
    }
    .is-today {
        background-color: rgba(238, 242, 255, 0.7);
        border-right: 5px solid #10b981; 
    }
    .daily-item-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .forecast-details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }
    @media (min-width: 640px) {
        .forecast-details {
            flex-direction: row;
            gap: 1rem;
        }
        .hidden-sm {
            display: block !important;
        }
    }
    @media (max-width: 639px) {
        .hidden-sm {
            display: none;
        }
    }
    .recommendation-box {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 7rem;
    }

    .tooltip-container {
        position: relative;
        cursor: help;
    }
    .tooltip {
        visibility: hidden;
        /* Tooltip styling */
    }
    .tooltip-container:hover .tooltip {
        visibility: visible;
        opacity: 1;
    }
    .details-panel {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }
    .is-selected .details-panel {
        max-height: 200px;
        border-top: 1px solid #e5e7eb;
    }
    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #f0fff0 0%, #d1f7d1 100%);
        direction: rtl;
    }
    .spinner {
        animation: spin 1s linear infinite;
        color: #16a34a;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .loading-card {
        text-align: center;
        padding: 2.5rem;
        border-radius: 1rem;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 8px 24px rgba(22,163,74,0.2);
    }
`;


// --- Main App Component (Orchestrating navigation) ---
function App() {
    // 'scheduler' is the default view
    const [activeSection, setActiveSection] = useState('scheduler');
    const [scrollPosition, setScrollPosition] = useState(0);

    const handleSectionChange = (section) => {
        setActiveSection(section);
        window.scrollTo(0, 0); 
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const renderContent = () => {
        // Use the three section IDs defined in your Navbar.jsx
        switch (activeSection) {
            case 'scheduler':
                return <PlantScheduler />;
            case 'about':
                return <PlaceholderContent section="about" />;
            case 'settings':
                return <PlaceholderContent section="settings" />;
            default:
                return <PlantScheduler />;
        }
    };

    return (
        <div className="app-container">
            {/* Inject all necessary CSS styles */}
            <style dangerouslySetInnerHTML={{ __html: styleSheet }} />
            
            {/* Navbar component imported from './components/Navbar' */}
            <Navbar onSectionChange={handleSectionChange} activeSection={activeSection} />

            {/* Content Container - Renders the selected view */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {renderContent()}
            </div>
        </div>
    );
}

export default App;