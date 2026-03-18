// Khi ấn Login thì cần gửi data đi để verify, axios là thư viện giúp gửi data đi
//axios là thư viện phụ trách gửi api và file này cấu hình api là chỉ gửi dạng JSON để mỗi lần gửi nó không phải dặn lại là tôi gửi dạng JSON 


import axios from 'axios';

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
