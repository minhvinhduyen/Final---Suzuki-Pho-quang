import React, { useMemo } from 'react';
import type { Job } from '../../types';
import { JobStatus, JobType } from '../../types';
import { useApp } from '../../hooks/useApp'; // NEW

interface TimelineFilterProps {
  jobs: Job[];
  filters: {
    status: string;
    advisor: string;
    jobType: string;
    date: string;
  };
  onFilterChange: (filterName: string, value: string) => void;
  onReset: () => void;
}

const TimelineFilter: React.FC<TimelineFilterProps> = ({ jobs, filters, onFilterChange, onReset }) => {
  const { state, loadMoreOldJobs } = useApp(); // NEW

  const advisors = useMemo(() => {
    const advisorSet = new Set(jobs.map(job => job.advisorName));
    return Array.from(advisorSet).sort();
  }, [jobs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange(e.target.name, e.target.value);
  };

  // Check if selected date is older than oldest loaded date
  const selectedDate = new Date(filters.date);
  const oldestDate = new Date(state.oldestLoadedDate);
  // Reset time for accurate comparison
  selectedDate.setHours(0, 0, 0, 0);
  oldestDate.setHours(0, 0, 0, 0);
  
  const isSelectedDateOlder = selectedDate < oldestDate;

  return (
    <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 shadow-sm flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
        <div className="font-bold text-gray-700 md:col-span-1 lg:col-span-1">Bộ lọc:</div>
        
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-600">Ngày</label>
          <input
            type="date"
            id="date-filter"
            name="date"
            value={filters.date}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
          />
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-600">Trạng thái</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(JobStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="advisor-filter" className="block text-sm font-medium text-gray-600">Cố vấn DV</label>
          <select
            id="advisor-filter"
            name="advisor"
            value={filters.advisor}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
          >
            <option value="">Tất cả cố vấn</option>
            {advisors.map(advisor => (
              <option key={advisor} value={advisor}>{advisor}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="jobtype-filter" className="block text-sm font-medium text-gray-600">Loại công việc</label>
          <select
            id="jobtype-filter"
            name="jobType"
            value={filters.jobType}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
          >
            <option value="">Tất cả loại</option>
            <option value={JobType.ScheduledMaintenance}>{JobType.ScheduledMaintenance}</option>
            <option value={JobType.Repair}>{JobType.Repair}</option>
          </select>
        </div>
        
        <button
          onClick={onReset}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full"
        >
          Xóa lọc
        </button>
      </div>
      
      {isSelectedDateOlder && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r flex items-center justify-between">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                          Ngày bạn chọn nằm ngoài khoảng thời gian đã tải (30 ngày gần nhất). 
                          Dữ liệu trên Bảng tiến độ có thể trống.
                      </p>
                  </div>
              </div>
              <button
                  onClick={() => loadMoreOldJobs(filters.date)}
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
                  {state.isLoadingOlder ? 'Đang tải...' : 'Tải dữ liệu cho ngày này'}
              </button>
          </div>
      )}
    </div>
  );
};

export default TimelineFilter;