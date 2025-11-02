import React, { useState, useEffect } from 'react';
import { Leaf, Droplet, Calendar, Sun, CloudRain } from 'lucide-react';

// --- CONSTANTS ---
const API_URL = 'http://localhost:5000/api/v1/weekly-forecast';
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tunisianDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// --- Sub-Component for a Single Day's Schedule ---
const DailyScheduleItem = ({ day, date, rain_mm, etc_mm, needed_mm, isSelected, onSelect }) => {
    const isToday = day === daysOfWeek[new Date().getDay()];
    const tunisianDay = tunisianDays[daysOfWeek.indexOf(day)];

    let neededStyle = { color: '#16a34a', fontWeight: '700' };
    let neededIcon = <Droplet className="icon-animate" style={{width:'20px',height:'20px',marginLeft:'8px'}} />;
    let neededText = `${needed_mm.toFixed(1)} ملم ماء`;

    if (needed_mm > 4.0) {
        neededStyle = { color: '#2563eb', fontWeight: 'bold' };
        neededText = 'ماء كثير';
    } else if (needed_mm === 0) {
        neededStyle = { color: '#d97706', fontWeight: 'bold' }; // Orange
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
                {/* Day and Date */}
                <div className={`day-info ${isToday ? 'day-info-today' : 'day-info-default'}`}> 
                    <span>{tunisianDay} {isToday && ' (اليوم)'}</span>
                    <span className="date-text">{date}</span>
                </div>
                {/* Forecast Info */}
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
                                    <span className="detail-value">{needed_mm} ملم</span>
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

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
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
            {/* Header */}
            <div className="card-header" style={{ backgroundColor: data.color, color: 'white' }}>
                <Leaf className="card-icon" style={{width:'32px',height:'32px',marginLeft:'1rem'}} />
                <div className="header-text">
                    <h2 className="header-title">{data.plantName}</h2>
                    <p className="header-subtitle">{data.plantId}</p>
                </div>
                <div className="expand-indicator"></div>
            </div>
            
            {/* Summary Stats */}
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

            {/* Weekly Schedule Detail */}
            <div className="schedule-detail">
                <h3 className="schedule-title-text">
                    <Calendar style={{width:'20px',height:'20px',marginLeft:'0.5rem'}} />
                    خطة الري لـ 7 أيام
                </h3>
                <div className="schedule-list">
                    {data.schedule.map((item, index) => (
                        <DailyScheduleItem key={index} {...item} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Application Component ---
const App = () => {
    const [forecasts, setForecasts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data Fetching from Flask API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setForecasts(data);
                
            } catch (error) {
                console.error("Error fetching data from Flask API:", error);
                // In a real app, you'd update state here to show an error message on the screen
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Standard CSS for the entire component (Arabic/RTL adapted)
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
            background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 50%, #f0fff4 100%);
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
            transition: transform 0.3s ease;
        }
        .header-style.scrolled {
            transform: translateY(-100%);
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
            max-width: 60rem; /* Increased width for better layout */
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
            grid-column: 1 / -1; /* Spans all columns */
            margin-bottom: 1rem;
            color: #14532d;
            border-right: 6px solid #16a34a;
            padding: 1rem 1.5rem 1rem 0.75rem;
            background: rgba(255,255,255,0.95);
            border-radius: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            backdrop-filter: blur(6px);
            text-align: right;
            line-height: 1.8;
            box-shadow: 0 2px 8px rgba(22,163,74,0.1);
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
            position: relative;
            cursor: pointer;
        }
        .plant-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 30px rgba(22,163,74,0.15);
            border-color: rgba(22,163,74,0.3);
        }
        .plant-card:active {
            transform: translateY(-2px) scale(0.99);
        }
        .card-header {
            padding: 1.5rem 1rem;
            display: flex;
            align-items: center;
            color: #fff;
        }
        .header-text {
            display: flex;
            flex-direction: column;
        }
        .header-title {
            font-size: 1.3rem;
            font-weight: 800;
        }
        .header-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            text-align: center;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
        }
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0 0.5rem;
        }
        .border-left {
            border-right: 1px solid #e5e7eb; /* RTL adjusted */
        }
        .stat-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #4b5563;
            text-transform: uppercase;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: 800;
        }
        .red-text { color: #dc2626; } /* Red-600 */
        .blue-text { color: #2563eb; } /* Blue-600 */
        .schedule-detail {
            padding: 0.5rem;
            flex-grow: 1;
        }
        .schedule-title-text {
            font-size: 1rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0.5rem 0.5rem 0.5rem 0.5rem;
            display: flex;
            align-items: center;
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
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .daily-item:last-child {
            border-bottom: none;
        }
        .daily-item:hover {
            background-color: #f8fafc;
            padding-right: 1.5rem;
        }
        .daily-item::before {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: 0;
            background: #16a34a;
            transition: width 0.3s ease;
        }
        .daily-item:hover::before {
            width: 4px;
        }
        .daily-item.is-selected {
            background: rgba(22, 163, 74, 0.05);
        }
        .daily-item.is-selected::before {
            width: 4px;
            background: #16a34a;
        }
        
        .tooltip-container {
            position: relative;
            cursor: help;
        }
        
        .tooltip {
            visibility: hidden;
            background-color: #1f2937;
            color: white;
            text-align: center;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            right: 50%;
            transform: translateX(50%);
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.875rem;
            white-space: nowrap;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .tooltip-container:hover .tooltip {
            visibility: visible;
            opacity: 1;
        }

        .icon-animate {
            transition: transform 0.3s ease;
        }
        
        .tooltip-container:hover .icon-animate {
            transform: scale(1.2);
        }
        
        .details-panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            background: rgba(255, 255, 255, 0.9);
            margin-top: 0.5rem;
        }
        
        .is-selected .details-panel {
            max-height: 200px;
            border-top: 1px solid #e5e7eb;
        }
        
        .details-content {
            padding: 1rem;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-top: 0.5rem;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
        }
        
        .detail-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
        }
        
        .detail-value {
            font-size: 1rem;
            font-weight: 600;
            color: #16a34a;
        }
        
        .plant-card {
            cursor: pointer;
        }
        
        .plant-card.expanded {
            transform: scale(1.02);
            box-shadow: 0 20px 30px rgba(22,163,74,0.15);
        }
        
        .expand-indicator {
            margin-right: auto;
            width: 24px;
            height: 24px;
            position: relative;
        }
        
        .expand-indicator::before,
        .expand-indicator::after {
            content: '';
            position: absolute;
            background-color: white;
            transition: transform 0.3s ease;
        }
        
        .expand-indicator::before {
            width: 2px;
            height: 12px;
            top: 6px;
            right: 11px;
        }
        
        .expand-indicator::after {
            width: 12px;
            height: 2px;
            top: 11px;
            right: 6px;
        }
        
        .expanded .expand-indicator::before {
            transform: rotate(90deg);
        }
        
        .card-icon {
            transition: transform 0.3s ease;
        }
        
        .expanded .card-icon {
            transform: rotate(360deg);
        }
        .daily-item-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .is-today {
            background-color: rgba(238, 242, 255, 0.7);
            border-right: 5px solid #10b981; /* Emerald border for today */
        }
        .day-info {
            display: flex;
            flex-direction: column;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .day-info-default {
            color: #374151;
        }
        .day-info-today {
            color: #10b981;
        }
        .date-text {
            font-size: 0.75rem;
            font-weight: 400;
            color: #6b7280;
        }
        .forecast-details {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            text-align: right;
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
        .forecast-item {
            font-size: 0.85rem;
            color: #4b5563;
            display: flex;
            align-items: center;
        }
        .recommendation-box {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            font-size: 0.9rem;
            min-width: 7rem;
        }
        .recommendation-text {
            font-weight: 700;
            margin-left: 0.25rem;
        }

        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f0fff0 0%, #d1f7d1 100%);
            direction: rtl;
        }
        .loading-card {
            text-align: center;
            padding: 2.5rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.95);
            box-shadow: 0 8px 24px rgba(22,163,74,0.2);
            backdrop-filter: blur(8px);
        }
        .spinner {
            height: 2.5rem;
            width: 2.5rem;
            color: #16a34a;
            margin: 0 auto 1.5rem auto;
            animation: spin 1s linear infinite;
        }
        .loading-text {
            margin-top: 1.5rem;
            color: #14532d;
            font-weight: 700;
            font-size: 1.1rem;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;

    if (loading) {
        return (
            <div className="loading-container">
                <style dangerouslySetInnerHTML={{ __html: styleSheet }} />
                <div className="loading-card">
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="loading-text">جاري الاتصال بخادم فلاسك وحساب الجداول...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <style dangerouslySetInnerHTML={{ __html: styleSheet }} />

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
                    نصائح لقراءة الجدول:
                    <ul style={{ paddingRight: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <li>الأيام المظللة بالأخضر تمثل اليوم الحالي</li>
                        <li>اللون الأزرق يعني حاجة عالية للري</li>
                        <li>اللون البرتقالي يعني لا حاجة للري</li>
                    </ul>
                </div>

                {forecasts.length === 0 ? (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#4b5563'}}>
                        <p style={{fontSize: '1.2rem'}}>لا توجد جداول نباتية حاليًا. تحقق من أن خادم Flask يعمل بشكل صحيح على المنفذ 5000.</p>
                    </div>
                ) : (
                    forecasts.map((plantData) => (
                        <PlantScheduleCard key={plantData.plantId} data={plantData} />
                    ))
                )}
                
                <div style={{gridColumn: '1 / -1', marginTop: '1rem', padding: '1.5rem', borderTop: '2px solid #16a34a', fontSize: '0.9rem', color: '#374151', fontWeight: '600', textAlign: 'center'}}>
                    مصدر البيانات: خوارزمية FAO-56 المتقدمة. يتم تشغيل الخادم بواسطة **Python/Flask**.
                </div>
            </main>
        </div>
    );
};

export default App;
