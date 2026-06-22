
// This service now communicates with the Google Apps Script backend.

declare global {
    interface Window {
        BACKEND_URL?: string;
    }
}

// Helper to make the API call to Google Apps Script
const callApi = async (action: string, payload?: any) => {
    const backendUrl = window.BACKEND_URL;
    if (!backendUrl) {
         throw new Error(
            'Lỗi cấu hình: URL của backend chưa được thiết lập trong file index.html. ' +
            'Vui lòng kiểm tra lại biến `window.BACKEND_URL`.'
        );
    }
    
    // Kiểm tra sơ bộ URL
    if (!backendUrl.includes('/exec')) {
        throw new Error('URL Backend không hợp lệ. URL phải kết thúc bằng "/exec" (không phải /dev). Vui lòng kiểm tra lại Deployment.');
    }

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            mode: 'cors', // Quan trọng: Đảm bảo mode là CORS
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Sử dụng text/plain để tránh preflight request phức tạp của Google
            },
            body: JSON.stringify({ action, payload }),
            redirect: 'follow'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi máy chủ (${response.status}): ${response.statusText}. Chi tiết: ${errorText}`);
        }

        const result = await response.json();

        // Xử lý lỗi đặc thù từ Backend
        if (result.status === 'error') {
            const msg = result.message || '';
            
            // Bắt lỗi cụ thể khi ID bảng tính bị sai hoặc không truy cập được
            if (msg.includes('Dịch vụ Bảng tính bị lỗi') || msg.includes('Service Spreadsheets failed') || msg.includes('missing')) {
                 throw new Error(
                    'LỖI CẤU HÌNH NGHIÊM TRỌNG:\n' +
                    'Web App đang cố kết nối đến một Google Sheet cũ đã bị xóa hoặc Script không có quyền truy cập.\n\n' +
                    'CÁCH KHẮC PHỤC:\n' +
                    '1. Vào Google Sheet MỚI của bạn -> Extensions -> Apps Script.\n' +
                    '2. Nhấn Deploy -> New deployment -> Chọn "Anyone" (Bất kỳ ai).\n' +
                    '3. Copy URL mới (có đuôi /exec).\n' +
                    '4. Dán URL đó vào biến window.BACKEND_URL trong file index.html.'
                );
            }

            if (msg.includes('SS_ID_NOT_CONFIGURED')) {
                throw new Error(
                    'LỖI MÃ NGUỒN BACKEND (APPS SCRIPT):\n' +
                    'File Google Apps Script chưa được cập nhật mã mới.\n' +
                    'Vui lòng copy đoạn mã trong file Code.gs (được cung cấp bởi AI) và dán đè vào Apps Script.'
                );
            }
            throw new Error(msg || 'Backend trả về một lỗi không xác định.');
        }

        return result.data;

    } catch (error) {
        console.error('API Call Failed:', error);
        
        // Chẩn đoán lỗi phổ biến khi copy file Sheet
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error(
                'KHÔNG THỂ KẾT NỐI ĐẾN GOOGLE SHEET!\n\n' +
                'Nguyên nhân phổ biến do file Sheet mới chưa được cấp quyền đúng.\n' +
                'Vui lòng làm theo các bước sau trên file Google Sheet mới:\n' +
                '1. Vào Extensions > Apps Script.\n' +
                '2. Nhấn nút "Deploy" màu xanh > chọn "New deployment".\n' +
                '3. Mục "Who has access" BẮT BUỘC chọn: "Anyone" (Bất kỳ ai).\n' +
                '4. Nhấn Deploy, copy URL mới và dán vào file index.html.'
            );
        }
        throw error;
    }
};


// --- API Service Implementation ---

// DEPRECATED: Use fetchFastData and fetchVehicles instead
export const fetchAllData = async () => {
    return await callApi('fetchAllData');
};

// NEW: Lightweight data fetch (Jobs, Users, Bays only) - No Locking
export const fetchFastData = async () => {
    return await callApi('fetchFastData');
};

// NEW: Heavyweight data fetch (Vehicles only) - No Locking
export const fetchVehicles = async () => {
    return await callApi('fetchVehicles');
};

// --- Job API (handles both jobs and appointments) ---

export const addJob = async (job: any) => {
    return await callApi('addJob', job);
};

export const updateJob = async (job: any) => {
    return await callApi('updateJob', job);
};

export const deleteJob = async (jobId: string) => {
    return await callApi('deleteJob', { id: jobId });
};


// --- User API ---

export const addUser = async (user: any) => {
    return await callApi('addUser', user);
};

export const updateUser = async (user: any) => {
    return await callApi('updateUser', user);
};

export const deleteUser = async (userId: string) => {
    return await callApi('deleteUser', { id: userId });
};

// --- Bay API ---

export const addBay = async (bay: any) => {
    return await callApi('addBay', bay);
};

export const updateBay = async (bay: any) => {
    return await callApi('updateBay', bay);
};

export const deleteBay = async (bayId: string) => {
    return await callApi('deleteBay', { id: bayId });
};

// --- Vehicle API ---

export const addVehicle = async (vehicle: any) => {
    return await callApi('addVehicle', vehicle);
};

export const updateVehicle = async (vehicle: any) => {
    return await callApi('updateVehicle', vehicle);
};

export const importVehicles = async (vehicles: any[]) => {
    return await callApi('importVehicles', { vehicles });
};
