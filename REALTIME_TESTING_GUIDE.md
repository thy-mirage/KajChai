# Real-time Chat Testing Guide

## Testing Instructions

1. **Start Backend:**
   ```bash
   cd KajChaiBackend
   .\mvnw.cmd spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd KajChaiFrontend
   npm run dev
   ```

3. **Test Real-time Messaging:**
   - Open two browser windows/tabs
   - Login as a Customer in one tab
   - Login as a Worker in another tab
   - Start a chat between them
   - Send messages from either side
   - Messages should appear instantly without refreshing

## Debug Information to Watch For:

### Frontend Console (Browser DevTools):
- `🔌 Setting up WebSocket for user: [userId] role: [role]`
- `✅ WebSocket connected successfully`
- `🎯 Setting up real-time subscription for room: [roomId]`
- `📨 Received real-time message for room [roomId]: [message]`

### Backend Console:
- `✅ WebSocket session established for user: [userId], role: [role]`
- `📨 WebSocket message received: [messageRequest]`
- `📡 Broadcasting message to: /topic/chat/[roomId]`
- `✅ Message broadcasted successfully`

## Connection Status Indicator:
- Green dot: Real-time messaging active
- Red dot: Real-time messaging offline

## Troubleshooting:
1. If WebSocket doesn't connect, check if backend is running on port 8080
2. Check browser console for any errors
3. Verify that JWT tokens are being sent properly
4. Make sure both users are in the same chat room
