import React from 'react';
import { JobStatus } from '../../types';

interface TimelineLegendProps {
  isFullScreen?: boolean;
}

const LegendItem: React.FC<{ colorClass: string; label: string; isFullScreen?: boolean }> = ({ colorClass, label, isFullScreen = false }) => (
  <div className={`flex items-center ${isFullScreen ? 'space-x-1.5' : 'space-x-2'}`}>
    <div className={`${isFullScreen ? 'w-3 h-3' : 'w-4 h-4'} rounded-md ${colorClass}`}></div>
    <span className={`${isFullScreen ? 'text-xs' : 'text-sm'} text-gray-700`}>{label}</span>
  </div>
);

const TimelineLegend: React.FC<TimelineLegendProps> = ({ isFullScreen = false }) => {
  const allItems = [
    { colorClass: "bg-status-appointment", label: JobStatus.Appointment },
    { colorClass: "bg-status-ticket-opened", label: JobStatus.TicketOpened },
    { colorClass: "bg-gray-400", label: JobStatus.Waiting },
    { colorClass: "bg-status-inprogress", label: JobStatus.InProgress },
    { colorClass: "bg-status-paused", label: JobStatus.Paused },
    { colorClass: "bg-status-completed", label: JobStatus.RepairComplete },
    { colorClass: "bg-status-washing", label: JobStatus.Washing },
    { colorClass: "bg-status-ready", label: JobStatus.Ready },
  ];

  const wrapperClass = isFullScreen
    ? "mb-2 p-1.5 bg-gray-50 border-b border-gray-200 rounded-md"
    : "mt-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm";

  const gridClass = isFullScreen
    ? "flex flex-wrap items-center justify-start gap-x-4 gap-y-1"
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-x-4 gap-y-2";
  
  return (
    <div className={wrapperClass}>
      {!isFullScreen && (
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-bold text-sm text-gray-800">Chú thích trạng thái:</h4>
          <span className="text-sm text-gray-600 italic">(Khối màu có chỉ vàng là công việc khách đợi để nhận xe)</span>
        </div>
      )}
      <div className={gridClass}>
        {allItems.map(item => (
            <LegendItem key={item.label} {...item} isFullScreen={isFullScreen} />
        ))}
      </div>
    </div>
  );
};

export default TimelineLegend;