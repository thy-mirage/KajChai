// Debug environment variables
console.log('=== Environment Debug ===');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('BASE_URL from API_CONFIG:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
console.log('========================');