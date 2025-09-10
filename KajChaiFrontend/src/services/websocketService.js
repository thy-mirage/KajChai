import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
  }

  connect(userId, userRole) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Attempting to connect WebSocket for user:', userId, 'role:', userRole);
        
        // Create STOMP client
        this.client = new Client({
          webSocketFactory: () => {
            console.log('Creating SockJS connection to http://localhost:8080/ws');
            return new SockJS('http://localhost:8080/ws');
          },
          connectHeaders: {
            // Add auth headers if needed
            Authorization: `Bearer ${localStorage.getItem('jwt_token')}`
          },
          debug: (str) => {
            console.log('STOMP Debug: ' + str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        // Handle connection
        this.client.onConnect = (frame) => {
          console.log('✅ Successfully connected to WebSocket:', frame);
          this.connected = true;
          
          // Store user info in session (for the WebSocket controller)
          setTimeout(() => {
            this.sendUserInfo(userId, userRole);
          }, 100); // Small delay to ensure connection is fully established
          
          resolve();
        };

        // Handle errors
        this.client.onStompError = (frame) => {
          console.error('STOMP error:', frame);
          this.connected = false;
          reject(new Error('WebSocket connection failed'));
        };

        // Handle disconnection
        this.client.onDisconnect = () => {
          console.log('Disconnected from WebSocket');
          this.connected = false;
        };

        // Activate the client
        this.client.activate();
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  sendUserInfo(userId, userRole) {
    if (this.client && this.connected) {
      // Send user info to establish session context
      const userInfoData = {
        userId: userId,
        userRole: userRole
      };
      
      console.log('📤 Sending user info to WebSocket server:', userInfoData);
      
      this.client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify(userInfoData)
      });
      
      console.log('✅ User info sent to WebSocket server');
    } else {
      console.error('❌ Cannot send user info: client not connected');
    }
  }

  subscribeToRoom(roomId, onMessageReceived) {
    if (!this.client || !this.connected) {
      console.error('❌ WebSocket not connected, cannot subscribe to room:', roomId);
      return null;
    }

    const destination = `/topic/chat/${roomId}`;
    console.log('📡 Subscribing to room:', roomId, 'at destination:', destination);
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(roomId)) {
      console.log('🔄 Unsubscribing from existing subscription for room:', roomId);
      this.subscriptions.get(roomId).unsubscribe();
    }

    // Subscribe to room messages
    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        console.log('📨 Received real-time message for room', roomId, ':', messageData);
        if (onMessageReceived) {
          onMessageReceived(messageData);
        }
      } catch (error) {
        console.error('❌ Error parsing received message:', error);
      }
    });

    this.subscriptions.set(roomId, subscription);
    this.messageHandlers.set(roomId, onMessageReceived);
    
    console.log('✅ Successfully subscribed to room:', roomId);
    return subscription;
  }

  unsubscribeFromRoom(roomId) {
    if (this.subscriptions.has(roomId)) {
      this.subscriptions.get(roomId).unsubscribe();
      this.subscriptions.delete(roomId);
      this.messageHandlers.delete(roomId);
    }
  }

  sendMessage(messageData) {
    if (!this.client || !this.connected) {
      console.error('❌ WebSocket not connected, cannot send message');
      return false;
    }

    try {
      console.log('📤 Sending message via WebSocket:', messageData);
      this.client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messageData)
      });
      console.log('✅ Message sent via WebSocket successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending message via WebSocket:', error);
      return false;
    }
  }

  disconnect() {
    if (this.client) {
      // Clear all subscriptions
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.messageHandlers.clear();
      
      // Disconnect
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
