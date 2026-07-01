
import React, { createContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import type { Job, Bay, User, Vehicle } from '../types';
import * as apiService from '../services/apiService';
import { JobStatus } from '../types';

// Default Suzuki Logo URL
const DEFAULT_LOGO = "https://inkythuatso.com/uploads/images/2021/11/logo-suzuki-inkythuatso-2-01-15-14-24-02.jpg";

interface AppState {
  jobs: Job[];
  bays: Bay[];
  users: User[];
  vehicles: Vehicle[]; // Added vehicles
  isTimelineFullScreen: boolean;
  isLoading: boolean;
  error: string | null;
  logoUrl: string;
  oldestLoadedDate: string;
  isLoadingOlder: boolean;
}

type Action =
  | { type: 'FETCH_DATA_START' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: { jobs: Job[], bays: Bay[], users: User[], vehicles: Vehicle[] } }
  | { type: 'FETCH_DATA_FAILURE'; payload: string }
  | { type: 'SET_ALL_DATA'; payload: { jobs: Job[], bays: Bay[], users: User[], vehicles: Vehicle[] } }
  | { type: 'ADD_JOB'; payload: Job }
  | { type: 'UPDATE_JOB'; payload: Job }
  | { type: 'DELETE_JOB'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_BAY'; payload: Bay }
  | { type: 'UPDATE_BAY'; payload: Bay }
  | { type: 'DELETE_BAY'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'SET_TIMELINE_FULLSCREEN'; payload: boolean }
  | { type: 'SET_LOGO'; payload: string }
  | { type: 'APPEND_OLDER_JOBS'; payload: { jobs: Job[], oldestDate: string } }
  | { type: 'SET_LOADING_OLDER'; payload: boolean };

const initialState: AppState = {
  jobs: [],
  bays: [],
  users: [],
  vehicles: [],
  isTimelineFullScreen: false,
  isLoading: true,
  error: null,
  logoUrl: localStorage.getItem('app_custom_logo') || DEFAULT_LOGO,
  oldestLoadedDate: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString(); })(),
  isLoadingOlder: false,
};


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'FETCH_DATA_START':
        return { ...state, isLoading: true, error: null };
    case 'FETCH_DATA_SUCCESS': {
        return { 
            ...state, 
            isLoading: false,
            jobs: action.payload.jobs,
            bays: action.payload.bays,
            users: action.payload.users,
            vehicles: action.payload.vehicles || [],
        };
    }
    case 'SET_ALL_DATA': {
        const newJobIds = new Set(action.payload.jobs.map((j: Job) => j.id));
        
        // Find the oldest date among the newly fetched jobs to determine the actual fetch boundary
        let actualOldestFetched = new Date();
        action.payload.jobs.forEach((j: Job) => {
            const d = j.plannedStartTime || j.actualStartTime;
            if (d && d < actualOldestFetched) {
                actualOldestFetched = d;
            }
        });
        // Add a 1-day buffer
        actualOldestFetched.setDate(actualOldestFetched.getDate() - 1);

        // Preserve jobs that were already loaded but not returned by the server,
        // ONLY IF they are older than the server's actual fetch boundary.
        // This prevents data loss if the backend script limits fetches to 30 days.
        const preservedOlderJobs = state.jobs.filter(j => {
            if (newJobIds.has(j.id)) return false;
            const d = j.plannedStartTime || j.actualStartTime;
            if (d && d < actualOldestFetched) return true;
            return false;
        });

        return {
            ...state,
            users: action.payload.users,
            bays: action.payload.bays,
            jobs: [...action.payload.jobs, ...preservedOlderJobs],
            vehicles: action.payload.vehicles || [],
            isInitialized: true,
        };
    }
    case 'FETCH_DATA_FAILURE':
        return { ...state, isLoading: false, error: action.payload };
    case 'ADD_JOB':
      return { ...state, jobs: [...state.jobs, action.payload] };
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        ),
      };
    case 'DELETE_JOB':
      return { ...state, jobs: state.jobs.filter(job => job.id !== action.payload) };
    case 'ADD_USER':
        return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
        return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_USER':
        return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'ADD_BAY':
        return { ...state, bays: [...state.bays, action.payload] };
    case 'UPDATE_BAY':
        return { ...state, bays: state.bays.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BAY':
        return { ...state, bays: state.bays.filter(b => b.id !== action.payload) };
    case 'ADD_VEHICLE':
        return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE':
        return { ...state, vehicles: state.vehicles.map(v => v.licensePlate === action.payload.licensePlate ? action.payload : v) };
    case 'SET_TIMELINE_FULLSCREEN':
        return { ...state, isTimelineFullScreen: action.payload };
    case 'SET_LOGO':
        return { ...state, logoUrl: action.payload };
    case 'SET_LOADING_OLDER':
        return { ...state, isLoadingOlder: action.payload };
    case 'APPEND_OLDER_JOBS':
        // Filter out duplicate jobs when appending
        const existingJobIds = new Set(state.jobs.map(j => j.id));
        const newJobs = action.payload.jobs.filter((j: Job) => !existingJobIds.has(j.id));
        return {
            ...state,
            jobs: [...newJobs, ...state.jobs],
            oldestLoadedDate: action.payload.oldestDate,
            isLoadingOlder: false,
        };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addJob: (job: Job) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addBay: (bay: Bay) => Promise<void>;
  updateBay: (bay: Bay) => Promise<void>;
  deleteBay: (bayId: string) => Promise<void>;
  checkAndUpsertVehicle: (job: Job) => Promise<void>;
  refreshData: () => Promise<void>;
  setLogo: (base64String: string) => void;
  resetLogo: () => void;
  importVehicles: (vehicles: Vehicle[]) => Promise<void>;
  loadMoreOldJobs: (targetDateStr: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

const safeNewDate = (dateString: any): Date | undefined => {
    if (!dateString) return undefined;
    
    // Thử parse theo định dạng DD/MM/YYYY hoặc DD/MM/YYYY HH:mm:ss của Google Sheet cũ
    if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split(/[\sT]+/); // Tách ngày và giờ
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        
        const dateParts = datePart.split('/');
        // Kiểm tra xem có đúng định dạng DD/MM/YYYY không (năm có 4 chữ số)
        if (dateParts.length === 3 && dateParts[2].length === 4) {
             // JS Date nhận định dạng YYYY-MM-DD
             const isoString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}`;
             const d = new Date(isoString);
             if (!isNaN(d.getTime())) return d;
        }
        // Trường hợp MM/DD/YYYY
        if (dateParts.length === 3 && dateParts[0].length <= 2 && dateParts[2].length === 4) {
             // js fallback
        }
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
};

const hydrateJobsAfterFetch = (items: any[]): Job[] => {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
        // Ignored empty rows silently
        if (!item || !item.id || item.id === "") return null;

        const plannedStartTime = safeNewDate(item.plannedStartTime);
        const plannedEndTime = safeNewDate(item.plannedEndTime);

        if (!plannedStartTime || !plannedEndTime) {
            console.warn('Bỏ qua công việc/lịch hẹn do ngày tháng không hợp lệ:', JSON.stringify(item, null, 2));
            return null;
        }
        
        const hydratedItem: Job = {
            ...item,
            km: item.km ? Number(item.km) : undefined,
            plannedStartTime,
            plannedEndTime,
            actualStartTime: safeNewDate(item.actualStartTime),
            actualEndTime: safeNewDate(item.actualEndTime),
            actualArrivalTime: safeNewDate(item.actualArrivalTime),
            appointmentCreatedAt: safeNewDate(item.appointmentCreatedAt),
            appointmentTime: safeNewDate(item.appointmentTime),
            stageHistory: Array.isArray(item.stageHistory) ? item.stageHistory.map((h: any) => ({
                ...h,
                startTime: safeNewDate(h.startTime)!,
                endTime: safeNewDate(h.endTime),
            })) : [],
            isAppointment: item.isAppointment || item.status === JobStatus.Appointment,
        };
        return hydratedItem;
    }).filter((item): item is Job => item !== null);
};


export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
        dispatch({ type: 'FETCH_DATA_START' });
        try {
            // OPTIMIZATION: Call both APIs in parallel
            // 1. Fast Data: Jobs, Users, Bays (Crucial for UI)
            // 2. Heavy Data: Vehicles (Background list)
            // Backend will not lock these reads, allowing for concurrency.
            const [fastData, vehicleData] = await Promise.all([
                apiService.fetchFastData(state.oldestLoadedDate),
                apiService.fetchVehicles()
            ]);

            const fastResult = fastData as any;
            const vehicleResult = vehicleData as any;

            dispatch({ 
                type: 'FETCH_DATA_SUCCESS', 
                payload: { 
                    users: fastResult.users, 
                    bays: fastResult.bays, 
                    jobs: hydrateJobsAfterFetch(fastResult.jobs),
                    vehicles: vehicleResult.vehicles || [],
                } 
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Đã có lỗi không xác định xảy ra';
            dispatch({ type: 'FETCH_DATA_FAILURE', payload: errorMessage });
        }
    };
    loadData();
  }, []);

  // Optimized refresh: Only fetches lightweight data (Jobs/Bays/Users), reusing existing Vehicles.
  // This prevents the "Server is busy" error caused by reading the huge Vehicle sheet repeatedly.
  const refreshData = useCallback(async () => {
    try {
        const data: any = await apiService.fetchFastData(state.oldestLoadedDate);
        dispatch({ 
            type: 'SET_ALL_DATA', 
            payload: { 
                users: data.users, 
                bays: data.bays, 
                jobs: hydrateJobsAfterFetch(data.jobs),
                // IMPORTANT: Keep existing vehicles, do not overwrite with empty or re-fetch unnecessary heavy data
                vehicles: state.vehicles, 
            } 
        });
    } catch (e) {
        console.error("Manual data refresh failed:", e);
        throw e;
    }
  }, [dispatch, state.vehicles, state.oldestLoadedDate]); // Dependency on state.vehicles ensures we don't lose them, oldestLoadedDate ensures we fetch back to what was loaded

  // Logic tự động lưu xe mới hoặc cập nhật thông tin xe
  // MOVED UP: Để addJob và updateJob có thể gọi được
  const checkAndUpsertVehicle = useCallback(async (job: Job) => {
      // --- LOGIC MỚI: CHỈ LƯU XE KHI HOÀN THÀNH HOẶC SẴN SÀNG GIAO ---
      // Nếu trạng thái không phải Hoàn thành SC hoặc Sẵn sàng giao xe, thoát luôn.
      if (job.status !== JobStatus.RepairComplete && job.status !== JobStatus.Ready) {
          return;
      }

      // Chỉ lưu xe nếu có thông tin đầy đủ và biển số hợp lệ
      if (!job.licensePlate || !job.customerName) return;

      // Hàm chuẩn hóa chuỗi: Bỏ dấu, bỏ khoảng trắng, chữ hoa
      // Ví dụ: "59A-123.45" -> "59A12345"
      const normalize = (str: string) => str ? str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
      
      const jobPlateClean = normalize(job.licensePlate);

      // Tìm kiếm xe trong danh sách bằng biển số đã chuẩn hóa
      const existingVehicle = state.vehicles.find(v => normalize(v.licensePlate) === jobPlateClean);
      
      // Dữ liệu mới từ Job (chỉ những trường JobForm có thể cung cấp)
      const inputData = {
          customerName: job.customerName,
          customerPhone: job.customerPhone || '',
          carModel: job.carModel,
          vin: job.vin || '',
      };

      if (!existingVehicle) {
          // Nếu xe chưa có trong hệ thống => Thêm mới
          const newVehicle: Vehicle = {
              id: `veh-${crypto.randomUUID()}`,
              licensePlate: job.licensePlate, // Lưu biển số theo định dạng nhập vào lần đầu
              ...inputData,
              color: '',
              purchaseDate: '',
              uio: false 
          };

          try {
              const added = await apiService.addVehicle(newVehicle);
              dispatch({ type: 'ADD_VEHICLE', payload: added });
          } catch (e) {
              console.error("Failed to auto-add vehicle:", e);
          }
      } else {
          // Nếu xe đã có, kiểm tra xem có thay đổi thông tin quan trọng từ JobForm không
          // So sánh tương đối cho số VIN (nếu có) để tránh cập nhật không cần thiết do định dạng
          const isVinChanged = inputData.vin && normalize(existingVehicle.vin || '') !== normalize(inputData.vin);

          const hasChanged = 
            existingVehicle.customerName !== inputData.customerName ||
            existingVehicle.customerPhone !== inputData.customerPhone ||
            existingVehicle.carModel !== inputData.carModel ||
            isVinChanged;
          
          if (hasChanged) {
             try {
                 // Merge dữ liệu cũ với dữ liệu mới
                 // Cập nhật lại licensePlate theo định dạng mới nhất từ Job (chuẩn hóa hiển thị)
                 const updatedVehicle: Vehicle = { 
                     ...existingVehicle, 
                     ...inputData,
                     licensePlate: job.licensePlate, // Cập nhật lại định dạng biển số nếu người dùng nhập đẹp hơn
                     vin: inputData.vin || existingVehicle.vin 
                 };
                 
                 const result = await apiService.updateVehicle(updatedVehicle);
                 dispatch({ type: 'UPDATE_VEHICLE', payload: result });
             } catch (e) {
                 console.error("Failed to auto-update vehicle:", e);
             }
          }
      }
  }, [dispatch, state.vehicles]);

  const addJob = useCallback(async (job: Job) => {
    const newJobFromApi = await apiService.addJob(job);
    const hydratedJob = hydrateJobsAfterFetch([newJobFromApi])[0];
    dispatch({ type: 'ADD_JOB', payload: hydratedJob });
    
    // Kích hoạt học dữ liệu xe (Sẽ bị chặn nếu status không phải hoàn thành)
    checkAndUpsertVehicle(hydratedJob);
  }, [dispatch, checkAndUpsertVehicle]);

  const updateJob = useCallback(async (job: Job) => {
    const updatedJobFromApi = await apiService.updateJob(job);
    const hydratedJob = hydrateJobsAfterFetch([updatedJobFromApi])[0];
    dispatch({ type: 'UPDATE_JOB', payload: hydratedJob });
    
    // Kích hoạt học dữ liệu xe (Chỉ chạy khi status chuyển sang Hoàn thành/Sẵn sàng)
    checkAndUpsertVehicle(hydratedJob);
  }, [dispatch, checkAndUpsertVehicle]);

  const deleteJob = useCallback(async (jobId: string) => {
    await apiService.deleteJob(jobId);
    dispatch({ type: 'DELETE_JOB', payload: jobId });
  }, [dispatch]);
  
  const addUser = useCallback(async (user: User) => {
      const newUser = await apiService.addUser(user);
      dispatch({ type: 'ADD_USER', payload: newUser });
  }, [dispatch]);

  const updateUser = useCallback(async (user: User) => {
      const updatedUser = await apiService.updateUser(user);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  }, [dispatch]);

  const deleteUser = useCallback(async (userId: string) => {
      await apiService.deleteUser(userId);
      dispatch({ type: 'DELETE_USER', payload: userId });
  }, [dispatch]);

  const addBay = useCallback(async (bay: Bay) => {
      const newBay = await apiService.addBay(bay);
      dispatch({ type: 'ADD_BAY', payload: newBay });
  }, [dispatch]);

  const updateBay = useCallback(async (bay: Bay) => {
      const updatedBay = await apiService.updateBay(bay);
      dispatch({ type: 'UPDATE_BAY', payload: updatedBay });
  }, [dispatch]);

  const deleteBay = useCallback(async (bayId: string) => {
      await apiService.deleteBay(bayId);
      dispatch({ type: 'DELETE_BAY', payload: bayId });
  }, [dispatch]);

  const setLogo = useCallback((base64String: string) => {
      localStorage.setItem('app_custom_logo', base64String);
      dispatch({ type: 'SET_LOGO', payload: base64String });
  }, [dispatch]);

  const resetLogo = useCallback(() => {
      localStorage.removeItem('app_custom_logo');
      dispatch({ type: 'SET_LOGO', payload: DEFAULT_LOGO });
  }, [dispatch]);

  const importVehicles = useCallback(async (vehicles: Vehicle[]) => {
      await apiService.importVehicles(vehicles);
      // For import, we DO need to fetch the vehicle list again to update UI
      // But we can call fetchVehicles specifically
      const vehicleResult: any = await apiService.fetchVehicles();
      const updatedVehicles = vehicleResult.vehicles || [];
      
      // We also need fast data to keep the state consistent
      const fastResult: any = await apiService.fetchFastData();
      
      dispatch({ 
        type: 'SET_ALL_DATA', 
        payload: { 
            users: fastResult.users, 
            bays: fastResult.bays, 
            jobs: hydrateJobsAfterFetch(fastResult.jobs),
            vehicles: updatedVehicles,
        } 
      });
  }, [dispatch]);

  const loadMoreOldJobs = useCallback(async (targetDateStr: string) => {
    dispatch({ type: 'SET_LOADING_OLDER', payload: true });
    try {
        const currentOldest = new Date(state.oldestLoadedDate);
        
        // Cập nhật: Tính toán khoảng thời gian cần tải để bao phủ được targetDate
        let targetDate = new Date(targetDateStr);
        if (isNaN(targetDate.getTime())) {
            targetDate = new Date();
        }
        
        // Đảm bảo targetDate là thời điểm bắt đầu của ngày đó
        targetDate.setHours(0, 0, 0, 0);

        // Nếu targetDate vẫn mới hơn currentOldest thì không cần tải (nhưng thường không xảy ra vì đã check ở UI)
        if (targetDate >= currentOldest) {
            dispatch({ type: 'SET_LOADING_OLDER', payload: false });
            return;
        }

        // Tải toàn bộ dữ liệu từ targetDate (trừ đi 1 ngày dự phòng) đến currentOldest
        const newOldest = new Date(targetDate);
        newOldest.setDate(newOldest.getDate() - 1);
        
        const data: any = await apiService.fetchOlderJobs(newOldest.toISOString(), currentOldest.toISOString());
        
        dispatch({ 
            type: 'APPEND_OLDER_JOBS', 
            payload: { 
                jobs: hydrateJobsAfterFetch(data.jobs),
                oldestDate: newOldest.toISOString(),
            } 
        });
    } catch (e) {
        console.error("Failed to load older jobs:", e);
        dispatch({ type: 'SET_LOADING_OLDER', payload: false });
        alert("Lỗi khi tải dữ liệu cũ: " + (e as Error).message);
    }
  }, [dispatch, state.oldestLoadedDate]);

  return (
    <AppContext.Provider value={{ 
        state, 
        dispatch,
        addJob,
        updateJob,
        deleteJob,
        addUser,
        updateUser,
        deleteUser,
        addBay,
        updateBay,
        deleteBay,
        checkAndUpsertVehicle,
        refreshData,
        setLogo,
        resetLogo,
        importVehicles,
        loadMoreOldJobs
    }}>
      {children}
    </AppContext.Provider>
  );
};
