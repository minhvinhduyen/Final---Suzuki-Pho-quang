
export enum Role {
  Manager = 'Quản lý',
  ServiceAdvisor = 'Cố vấn dịch vụ',
  ForemanSC = 'Tổ trưởng SC', 
  ForemanDS = 'Tổ trưởng ĐS',
  CustomerCare = 'Chăm sóc khách hàng',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string;
}

export interface Vehicle {
  id: string; // License Plate is usually unique, but we use ID for consistency.
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  carModel: string;
  vin?: string;
  color?: string;       // Màu xe
  purchaseDate?: string; // Ngày mua (lưu dạng string ISO hoặc text cho đơn giản)
  uio?: boolean;        // UIO Flag
}

export enum BayType {
  General = 'General',
  CarWash = 'CarWash',
  BodyShop = 'BodyShop',
}

export interface Bay {
  id: string;
  name:string;
  type: BayType;
  technician?: string;
  supportsLift: boolean;
}

export enum JobType {
  ScheduledMaintenance = 'Bảo dưỡng định kỳ',
  Repair = 'Sửa chữa chung',
  BodyAndPaint = 'Đồng sơn',
}

export enum JobStatus {
  Appointment = 'Hẹn',
  MissedAppointment = 'Bỏ hẹn',
  Arrived = 'Chờ tiếp nhận',
  TicketOpened = 'Đã mở phiếu',
  Waiting = 'Chờ sửa chữa',
  InProgress = 'Đang làm',
  Paused = 'Dừng sửa chữa',
  RepairComplete = 'Hoàn thành SC',
  Washing = 'Rửa xe',
  Ready = 'Sẵn sàng giao xe',
  // Statuses for Gate Pass (Giấy ra cổng)
  FreeInspection = 'Kiểm tra miễn phí',
  Quotation = 'Báo giá',
}

export enum BodyShopStage {
    Dong = 'Làm đồng',
    Nen = 'Làm nền',
    Son = 'Sơn màu',
    Bong = 'Đánh bóng và dọn xe',
    HoanThanh = 'Hoàn thành'
}

export interface StageHistory {
  stage: BodyShopStage;
  startTime: Date;
  endTime?: Date;
}

export interface Job {
  id: string;
  licensePlate: string;
  customerName: string;
  customerPhone?: string;
  carModel: string;
  vin?: string; // Added VIN
  jobType: JobType;
  advisorName: string;
  status: JobStatus;
  
  plannedStartTime: Date;
  plannedEndTime: Date;

  actualStartTime?: Date;
  actualEndTime?: Date;
  actualArrivalTime?: Date;
  
  bayId?: string;
  technician?: string;
  useLift: boolean;
  isAppointment?: boolean;
  appointmentCreatedAt?: Date;
  appointmentTime?: Date; // Thời gian hẹn gốc, không thay đổi
  isWaitingCustomer?: boolean; // Khách chờ lấy xe

  // Body & Paint specific
  bodyShopStage?: BodyShopStage;
  stageHistory?: StageHistory[];
  laborCost?: number;
  km?: number;
  
  // For paused jobs
  continuationOfJobId?: string;
  
  // For revenue data
  jsonData?: string;
}

export const CAR_MODELS = [
    "Jimny", "Ertiga", "XL7", "Swift", "Ciaz", "Vitara", "Fronx", 
    "Celerio", "Truck", "Blind Van", "Pro", "APV", "Eco Van", "Wagon", "Khác"
];
