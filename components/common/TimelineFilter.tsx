import React, { useMemo } from 'react';
import type { Job } from '../../types';
import { JobStatus, JobType } from '../../types';

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
  const advisors = useMemo(() => {
    const advisorSet = new Set(jobs.map(job => job.advisorName));
    return Array.from(advisorSet).sort();
  }, [jobs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange(e.target.name, e.target.value);
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200 shadow-sm">
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
    </div>
  );
};

export default TimelineFilter;