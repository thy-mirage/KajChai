// Debug environment variables - FORCE REBUILD
console.log('=== Environment Debug v1.0.1 ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('API_CONFIG BASE_URL will be:', import.meta.env.VITE_API_BASE_URL || 'https://kajchai.onrender.com');
console.log('Current timestamp:', new Date().toISOString());
console.log('=============================');