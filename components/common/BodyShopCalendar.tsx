
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Job } from '../../types';
import { JobStatus, BodyShopStage, JobType } from '../../types';
import { useApp } from '../../hooks/useApp';

interface BodyShopCalendarProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
}

const BscJobBlock: React.FC<{ job: Job; style: React.CSSProperties; colorClass: string; onDoubleClick: (job: Job) => void; }> = ({ job, style, colorClass, onDoubleClick }) => {
    const [isHovering, setIsHovering] = useState(false);

    const formatTime = (date?: Date) => date ? new Date(date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const advisorLastName = job.advisorName.split(' ').pop() || '';
    const laborCostDisplay = job.laborCost ? `${job.laborCost.toLocaleString('vi-VN')}đ` : '';

    return (
        <div
            style={style}
            className={`absolute h-10 p-1 text-white text-xs font-semibold rounded shadow-md cursor-pointer flex items-center overflow-hidden ${colorClass}`}
            onDoubleClick={() => onDoubleClick(job)}
            title={`${job.licensePlate} - ${job.customerName}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {isHovering && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-gray-800 text-white text-xs rounded-md shadow-lg z-50 pointer-events-none">
                    <p className="font-bold border-b pb-1 mb-1">{job.licensePlate} - {job.customerName}</p>
                    <p><strong>Loại CV:</strong> {job.jobType}</p>
                    <p><strong>CVDV:</strong> {job.advisorName}</p>
                    <p><strong>Trạng thái:</strong> {job.status}</p>
                    {job.bodyShopStage && <p><strong>Giai đoạn:</strong> {job.bodyShopStage}</p>}
                    <p><strong>DK:</strong> {formatTime(job.plannedStartTime)} - {formatTime(job.plannedEndTime)}</p>
                </div>
            )}
            <span className="whitespace-normal break-words">{job.licensePlate} {job.carModel} {advisorLastName} {laborCostDisplay}</span>
        </div>
    );
};


// FIX: The default value for the onJobClick prop had an incorrect function signature. It was defined to accept 0 arguments, but it is called with one (the job object). This has been corrected to accept one argument to prevent a runtime error.
const BodyShopCalendar: React.FC<BodyShopCalendarProps> = ({ jobs, onJobClick = (_job) => {} }) => {
  const { state, loadMoreOldJobs } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  const firstDayOfView = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const oldestDate = new Date(state.oldestLoadedDate);
  oldestDate.setHours(0, 0, 0, 0);
  const isSelectedDateOlder = firstDayOfView < oldestDate;

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  }, [currentDate]);

  // Effect to scroll the current day into the center of the view on load/month change
  useEffect(() => {
    if (isCurrentMonth && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const today = new Date().getDate();

      // Get root font size to calculate rem units in pixels. Assumes 1rem = 16px as a fallback.
      const rootFontSize = typeof window !== 'undefined' 
        ? parseFloat(getComputedStyle(document.documentElement).fontSize) 
        : 16;
      const dayColumnWidthPx = 4 * rootFontSize; // Each day column is 4rem wide

      // Calculate the horizontal center of today's column
      const todayColumnCenter = (today - 0.5) * dayColumnWidthPx;
      
      // Calculate the scroll position to center this point in the container
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = todayColumnCenter - (containerWidth / 2);

      // Use a timeout to ensure the layout is fully rendered before scrolling
      setTimeout(() => {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }, 100); // 100ms delay as a safeguard
    }
  }, [isCurrentMonth, currentDate]); // Rerun when the month changes to re-center if needed

  // Effect for the live time indicator line
  useEffect(() => {
    if (!isCurrentMonth) {
      setTimeIndicatorPosition(-1);
      return;
    }

    const updatePosition = () => {
      const now = new Date();
      const dayColumnStartRem = (now.getDate() - 1) * 4;

      const WORK_START_HOUR = 7.25; // 7:15 AM
      const WORK_END_HOUR = 17.0; // 5:00 PM
      const TOTAL_WORK_DURATION_HOURS = WORK_END_HOUR - WORK_START_HOUR;

      const currentHour = now.getHours() + now.getMinutes() / 60;

      if (currentHour >= WORK_START_HOUR && currentHour <= WORK_END_HOUR) {
        const progressInDay = (currentHour - WORK_START_HOUR) / TOTAL_WORK_DURATION_HOURS;
        const offsetInDayRem = progressInDay * 4; // Day cell is 4rem wide
        setTimeIndicatorPosition(dayColumnStartRem + offsetInDayRem);
      } else {
        setTimeIndicatorPosition(-1); // Hide outside work hours
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isCurrentMonth]);


  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const getJobColor = (job: Job): string => {
      // Ưu tiên hiển thị màu đỏ nếu là xe Hẹn
      if (job.status === JobStatus.Appointment) {
          return 'bg-status-appointment';
      }

      if (job.status === JobStatus.InProgress && job.jobType === JobType.BodyAndPaint && job.bodyShopStage) {
        switch (job.bodyShopStage) {
          case BodyShopStage.Dong: return 'bg-yellow-500';
          case BodyShopStage.Nen: return 'bg-orange-500';
          case BodyShopStage.Son: return 'bg-sky-500';
          case BodyShopStage.Bong: return 'bg-indigo-600';
          default: break;
        }
      }
  
      // General status colors
      switch (job.status) {
        case JobStatus.Waiting: return 'bg-cyan-400';
        case JobStatus.InProgress: return 'bg-orange-500'; // Default for In Progress
        case JobStatus.RepairComplete:
        case JobStatus.Washing:
        case JobStatus.Ready:
          return 'bg-green-600';
        default: return 'bg-gray-400';
      }
    };

  // LOGIC MỚI: Tự động tính toán số dòng cần thiết (Dynamic Slot Calculation)
  const jobLayout = useMemo(() => {
    // 1. Khởi tạo mảng layout với cố định 15 dòng theo yêu cầu (Thay vì 7)
    // Mỗi phần tử là một mảng đại diện cho 1 dòng, chứa các Job (hoặc null) cho từng ngày trong tháng
    const rows: (Job | null)[][] = Array(15).fill(null).map(() => Array(daysInMonth + 1).fill(null));
    
    // FILTER: Loại bỏ các xe Báo giá và Kiểm tra miễn phí ngay tại nguồn hiển thị
    const visibleJobs = jobs.filter(j => 
        j.status !== JobStatus.FreeInspection && 
        j.status !== JobStatus.Quotation
    );
    
    const sortedJobs = [...visibleJobs].sort((a, b) => a.plannedStartTime.getTime() - b.plannedStartTime.getTime());
    
    const viewStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const viewEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const intersectingJobs = sortedJobs.filter(job => {
        return job.plannedStartTime.getTime() <= viewEndDate.getTime() && job.plannedEndTime.getTime() >= viewStartDate.getTime();
    });

    intersectingJobs.forEach(job => {
      const jobStartDayInView = job.plannedStartTime < viewStartDate
          ? 1
          : job.plannedStartTime.getDate();

      const jobEndDayInView = job.plannedEndTime > viewEndDate
          ? daysInMonth
          : job.plannedEndTime.getDate();
      
      let placed = false;

      // 2. Thử xếp xe vào các dòng hiện có
      for (let i = 0; i < rows.length; i++) {
        let canPlace = true;
        // Kiểm tra va chạm trong khoảng ngày của job
        for (let j = jobStartDayInView; j <= jobEndDayInView; j++) {
          if (rows[i][j]) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          for (let j = jobStartDayInView; j <= jobEndDayInView; j++) {
            rows[i][j] = job;
          }
          placed = true;
          break;
        }
      }

      // 3. Nếu không dòng nào trống, TỰ ĐỘNG THÊM DÒNG MỚI (Vẫn giữ logic này để tránh mất xe nếu > 15 xe)
      if (!placed) {
        const newRow = Array(daysInMonth + 1).fill(null);
        for (let j = jobStartDayInView; j <= jobEndDayInView; j++) {
            newRow[j] = job;
        }
        rows.push(newRow);
      }
    });

    // Logic "đệm" cũ đã được loại bỏ vì chúng ta đã khởi tạo sẵn 15 dòng, đủ khoảng trống cần thiết.

    return rows;
  }, [jobs, currentDate, daysInMonth]);

  const numSlots = jobLayout.length; // Số lượng dòng thực tế sau khi tính toán

  const renderJobBlocks = () => {
    const renderedJobs = new Set<string>();
    const blocks: React.ReactNode[] = [];

    // Lặp qua số dòng động (numSlots) thay vì hằng số cố định
    for (let i = 0; i < numSlots; i++) {
      for (let j = 1; j <= daysInMonth; j++) {
        const job = jobLayout[i][j];
        if (job && !renderedJobs.has(job.id)) {
          const jobStartMonth = job.plannedStartTime.getMonth();
          const jobEndMonth = job.plannedEndTime.getMonth();
          const jobStartYear = job.plannedStartTime.getFullYear();
          const jobEndYear = job.plannedEndTime.getFullYear();

          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          const startsBeforeView = jobStartYear < currentYear || (jobStartYear === currentYear && jobStartMonth < currentMonth);
          const endsAfterView = jobEndYear > currentYear || (jobEndYear === currentYear && jobEndMonth > currentMonth);

          const startDay = startsBeforeView ? 1 : job.plannedStartTime.getDate();
          const endDay = endsAfterView ? daysInMonth : job.plannedEndTime.getDate();
          
          const isStartingInAfternoon = job.plannedStartTime.getHours() >= 12;
          const isEndingInMorning = job.plannedEndTime.getHours() < 12;
          
          const shouldShiftStart = !startsBeforeView;
          const shouldShiftEnd = !endsAfterView;

          let leftOffsetRem = 0;
          if (isStartingInAfternoon && shouldShiftStart) {
            leftOffsetRem = 2; // Half a day cell (4rem / 2)
          }

          const durationInDays = endDay - startDay + 1;
          let widthInRem = durationInDays * 4;

          if (isStartingInAfternoon && shouldShiftStart) {
            widthInRem -= 2;
          }
          if (isEndingInMorning && shouldShiftEnd) {
            widthInRem -= 2;
          }
          
          if (widthInRem <= 0) {
              widthInRem = 2; // Minimum width is half a day cell
          }
          
          blocks.push(
            <BscJobBlock
              key={job.id}
              job={job}
              style={{
                top: `${i * 3}rem`,
                left: `calc(${(startDay - 1) * 4}rem + ${leftOffsetRem}rem)`,
                width: `calc(${widthInRem}rem - 2px)`,
              }}
              colorClass={getJobColor(job)}
              onDoubleClick={onJobClick}
            />
          );
          renderedJobs.add(job.id);
        }
      }
    }
    return blocks;
  };

  const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded ${color}`}></div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="px-3 py-1 bg-gray-200 rounded">&lt;</button>
        <h3 className="text-xl font-bold">{`Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`}</h3>
        <button onClick={goToNextMonth} className="px-3 py-1 bg-gray-200 rounded">&gt;</button>
      </div>

      {isSelectedDateOlder && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r flex items-center justify-between mb-4">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                          Tháng bạn chọn nằm ngoài khoảng thời gian đã tải (30 ngày gần nhất). 
                          Dữ liệu trên Bảng tiến độ có thể trống.
                      </p>
                  </div>
              </div>
              <button
                  onClick={() => loadMoreOldJobs(firstDayOfView.toISOString())}
                  disabled={state.isLoadingOlder}
                  className="ml-4 flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50 flex items-center shadow"
              >
                  {state.isLoadingOlder ? (
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  )}
                  {state.isLoadingOlder ? 'Đang tải...' : 'Tải dữ liệu cho tháng này'}
              </button>
          </div>
      )}

      <div ref={scrollContainerRef} className="overflow-x-auto">
        {/* Chiều cao được tính toán dựa trên số dòng động (numSlots) */}
        <div className="relative" style={{ width: `${daysInMonth * 4}rem`, minHeight: `${numSlots * 3}rem` }}>
           {/* Grid Background */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 4rem)` }}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
              const dayOfWeek = day.getDay();
              const isSaturday = dayOfWeek === 6;
              const isSunday = dayOfWeek === 0;
              let bgColor = 'bg-white';
              if (isSaturday) bgColor = 'bg-gray-200';
              if (isSunday) bgColor = 'bg-gray-300';
              return <div key={i} className={`h-full border-r ${bgColor}`}></div>;
            })}
          </div>

          {/* Header */}
          <div className="sticky top-0 z-10 grid bg-white" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 4rem)` }}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
              const dayOfWeek = day.getDay();
              const isSaturday = dayOfWeek === 6;
              const isSunday = dayOfWeek === 0;
              let weekendClass = '';
              if (isSaturday) weekendClass = 'bg-gray-200';
              if (isSunday) weekendClass = 'bg-gray-300';

              return (
                <div key={i} className={`text-center border-b-2 border-r p-1 ${weekendClass}`}>
                  <p className="text-xs font-semibold">{dayOfWeek === 0 ? 'CN' : `Thứ ${dayOfWeek + 1}`}</p>
                  <p className="font-bold">{i + 1}</p>
                </div>
              );
            })}
          </div>
          
           {/* Jobs Container */}
          <div className="relative w-full h-full">
            {renderJobBlocks()}
            {isCurrentMonth && timeIndicatorPosition >= 0 && (
                 <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `${timeIndicatorPosition}rem` }}>
                    <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
          <h4 className="font-bold text-sm mb-2 text-gray-800">Chú thích công việc Đồng sơn:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-2">
              <LegendItem color="bg-status-appointment" label="Xe có hẹn" />
              <LegendItem color="bg-cyan-400" label={JobStatus.Waiting} />
              <LegendItem color="bg-yellow-500" label={`GĐ: ${BodyShopStage.Dong}`} />
              <LegendItem color="bg-orange-500" label={`GĐ: ${BodyShopStage.Nen}`} />
              <LegendItem color="bg-sky-500" label={`GĐ: ${BodyShopStage.Son}`} />
              <LegendItem color="bg-indigo-600" label={`GĐ: ${BodyShopStage.Bong}`} />
              <LegendItem color="bg-green-600" label={`${BodyShopStage.HoanThanh} / Chờ giao`} />
          </div>
      </div>
    </div>
  );
};

export default BodyShopCalendar;
