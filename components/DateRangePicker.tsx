import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const parseDate = (dateStr: string) => dateStr ? new Date(dateStr) : null;

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const clickedDateStr = formatDate(clickedDate);

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onChange(clickedDateStr, '');
    } else if (startDate && !endDate) {
      // Complete selection
      if (clickedDate < (start as Date)) {
        onChange(clickedDateStr, startDate);
      } else {
        onChange(startDate, clickedDateStr);
      }
      setIsOpen(false);
    }
  };

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    // Adjust for Monday start (0=Mon, 6=Sun)
    let firstDay = getFirstDayOfMonth(year, month) - 1;
    if (firstDay < 0) firstDay = 6;

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      
      let isSelected = false;
      let isRange = false;
      let isStart = false;
      let isEnd = false;

      if (start && dateStr === formatDate(start)) { isSelected = true; isStart = true; }
      if (end && dateStr === formatDate(end)) { isSelected = true; isEnd = true; }
      if (start && end && date > start && date < end) { isRange = true; }

      let classes = "h-9 w-9 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700 relative z-10 ";
      
      if (isStart || isEnd) {
        classes += "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 ";
      } else if (isRange) {
        classes += "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-none ";
        // First/Last in row visual fix could go here, but keeping simple
      } else {
        classes += "text-slate-700 dark:text-slate-200 ";
      }

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={classes}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full h-11 px-3.5 
          bg-white dark:bg-slate-950 
          border border-slate-200 dark:border-slate-700 
          rounded-xl cursor-pointer transition-all 
          hover:border-blue-400 dark:hover:border-blue-500
          focus:ring-4 focus:ring-blue-100
          ${isOpen ? 'ring-4 ring-blue-100 dark:ring-blue-900/20 border-blue-500' : ''}
        `}
      >
        <CalendarIcon size={18} className="text-slate-400 flex-shrink-0" />
        <div className="flex-1 text-sm truncate flex items-center gap-2">
          {startDate ? (
            <span className="text-slate-900 dark:text-white font-medium">
              {formatDisplayDate(startDate)}
              {endDate ? ` - ${formatDisplayDate(endDate)}` : ' - ...'}
            </span>
          ) : (
            <span className="text-slate-400">Filtrer par date...</span>
          )}
        </div>
        {startDate ? (
           <div onClick={clearDates} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
             <X size={14} />
           </div>
        ) : (
           <ChevronRight size={16} className="text-slate-400 rotate-90" />
        )}
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-12 left-0 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-[320px] animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-slate-800 dark:text-white capitalize">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-2">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
              <div key={d} className="h-8 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {renderCalendar()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {startDate && !endDate ? 'Sélectionnez la date de fin' : 'Période sélectionnée'}
            </span>
            {startDate && endDate && (
              <button 
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Appliquer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};