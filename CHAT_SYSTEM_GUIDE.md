# Chat System API Testing Guide

## Overview
The chat system allows customers to chat with workers and vice versa. Users of the same type cannot chat with each other.

## Database Tables Created

### ChatRoom
- `roomId` (Long, Primary Key)
- `roomName` (String, Unique) - Format: "customer_{customerId}_worker_{workerId}"
- `customerId` (Integer) - References Customer.customerId
- `workerId` (Integer) - References Worker.workerId
- `createdAt` (LocalDateTime)
- `lastActivity` (LocalDateTime)

### ChatMessage
- `messageId` (Long, Primary Key)
- `roomId` (Long, Foreign Key to ChatRoom)
- `senderId` (Integer) - Either customerId or workerId
- `senderRole` (UserRole ENUM) - CUSTOMER or WORKER
- `content` (Text)
- `isRead` (Boolean, default false)
- `sentAt` (LocalDateTime)

## API Endpoints

### 1. Get Chat Rooms
**GET** `/api/chat/rooms`
- Returns list of chat rooms for the authenticated user
- Response includes other user details and unread count

### 2. Create or Get Chat Room
**POST** `/api/chat/rooms?otherUserId={userId}`
- Creates a new chat room or returns existing one between current user and specified user
- Validates that users are of different types (customer vs worker)

### 3. Get Messages
**GET** `/api/chat/rooms/{roomId}/messages`
- Returns all messages for the specified room
- Automatically marks messages as read for the requesting user

### 4. Send Message
**POST** `/api/chat/send`
```json
{
    "receiverId": 1,
    "receiverRole": "WORKER",
    "content": "Hello, I need help with my project"
}
```

### 5. Get Available Users
**GET** `/api/chat/users`
- For customers: returns all workers
- For workers: returns all customers

### 6. Mark Messages as Read
**PUT** `/api/chat/rooms/{roomId}/read`
- Marks all unread messages in the room as read for the current user

## Frontend Features

### Chat Interface
- **Sidebar**: Shows list of chat rooms with last message and unread count
- **Main Area**: Shows selected conversation with messages
- **User List Modal**: Allows starting new conversations
- **Real-time-like**: Auto-refreshes to show new messages

### User Experience
1. Click "+" to see available users to chat with
2. Click on a user to start a new conversation
3. Select existing conversations from the sidebar
4. Send messages using the input field at the bottom
5. Messages are automatically marked as read when viewing

## Testing Steps

### Prerequisites
1. Create at least one customer account
2. Create at least one worker account
3. Ensure both users are logged in (in different browsers/sessions)

### Test Scenarios

#### 1. Customer Initiating Chat with Worker
1. Login as customer
2. Go to `/chat` page
3. Click "+" button
4. Should see list of available workers
5. Click on a worker to start chat
6. Send a message
7. Verify chat room is created

#### 2. Worker Responding to Customer
1. Login as worker (different browser)
2. Go to `/chat` page
3. Should see the chat room with unread message count
4. Click on the chat room
5. Should see customer's message
6. Send a reply
7. Verify message is sent

#### 3. Validation Tests
1. Try to create chat between two customers (should fail)
2. Try to create chat between two workers (should fail)
3. Try to send message to non-existent user (should fail)

## Expected Behavior

### Access Control
- Customers can only see and message workers
- Workers can only see and message customers
- Same user types cannot chat with each other

### Message Threading
- All messages between a customer-worker pair go to the same room
- Messages are ordered by timestamp
- Unread messages are tracked per user

### UI/UX
- Chat interface resembles modern messaging apps
- Responsive design works on different screen sizes
- Real-time-like experience through API calls

## Troubleshooting

### Common Issues
1. **"User not found"**: Ensure the target user exists and has the correct role
2. **"Users of the same type cannot message each other"**: Verify user roles are different
3. **Authentication errors**: Ensure user is properly logged in
4. **Database errors**: Check that chat tables are created and foreign keys are valid

### Backend Logs
Check application logs for detailed error messages, especially for:
- Database constraint violations
- Authentication failures
- Invalid user role combinations
