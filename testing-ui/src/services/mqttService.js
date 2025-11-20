import mqtt from 'mqtt';
import config from '../config';

class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.messageLog = [];
    this.connectionStatus = 'disconnected';
    this.lastError = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  // Connect to the MQTT broker
  connect(onConnect, onError) {
    if (this.client && this.isConnected) {
      console.log('MQTT: Already connected');
      if (onConnect) onConnect();
      return;
    }

    this.connectionStatus = 'connecting';
    this.connectionAttempts++;
    
    try {
      console.log(`MQTT: Connecting to ${config.mqtt.broker}`);
      this.client = mqtt.connect(config.mqtt.broker, {
        ...config.mqtt.options,
        clientId: config.mqtt.clientId,
      });

      // Set up event handlers
      this.client.on('connect', () => {
        console.log('MQTT: Connected successfully');
        this.isConnected = true;
        this.connectionStatus = 'connected';
        this.connectionAttempts = 0;
        if (onConnect) onConnect();
      });

      this.client.on('error', (err) => {
        console.error('MQTT Error:', err);
        this.lastError = err;
        this.connectionStatus = 'error';
        if (onError) onError(err);
      });

      this.client.on('message', (topic, message) => {
        const messageObj = {
          topic,
          message: message.toString(),
          timestamp: new Date(),
        };
        
        this.messageLog.push(messageObj);
        
        // If we have callbacks registered for this topic, call them
        if (this.subscriptions.has(topic)) {
          this.subscriptions.get(topic).forEach(callback => {
            try {
              callback(messageObj);
            } catch (err) {
              console.error(`MQTT: Error in subscription callback for topic ${topic}:`, err);
            }
          });
        }
      });

      this.client.on('offline', () => {
        console.log('MQTT: Disconnected');
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
      });

      this.client.on('reconnect', () => {
        console.log('MQTT: Attempting to reconnect');
        this.connectionStatus = 'reconnecting';
      });

    } catch (err) {
      console.error('MQTT: Connection error', err);
      this.lastError = err;
      this.connectionStatus = 'error';
      if (onError) onError(err);
      
      // Retry connection if under max attempts
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`MQTT: Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
        setTimeout(() => this.connect(onConnect, onError), 2000);
      }
    }
  }

  // Disconnect from the MQTT broker
  disconnect() {
    if (!this.client) return Promise.resolve();
    
    return new Promise((resolve) => {
      this.client.end(true, {}, () => {
        console.log('MQTT: Disconnected by user');
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        resolve();
      });
    });
  }

  // Subscribe to a topic
  subscribe(topic, callback) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT: Not connected'));
        return;
      }

      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`MQTT: Error subscribing to ${topic}`, err);
          reject(err);
          return;
        }

        console.log(`MQTT: Subscribed to ${topic}`);
        
        // Add callback to our subscriptions map
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.set(topic, []);
        }
        
        if (callback) {
          this.subscriptions.get(topic).push(callback);
        }
        
        resolve();
      });
    });
  }

  // Unsubscribe from a topic
  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT: Not connected'));
        return;
      }

      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`MQTT: Error unsubscribing from ${topic}`, err);
          reject(err);
          return;
        }

        console.log(`MQTT: Unsubscribed from ${topic}`);
        this.subscriptions.delete(topic);
        resolve();
      });
    });
  }

  // Publish a message to a topic
  publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT: Not connected'));
        return;
      }

      const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;
      
      this.client.publish(topic, messageStr, options, (err) => {
        if (err) {
          console.error(`MQTT: Error publishing to ${topic}`, err);
          reject(err);
          return;
        }

        console.log(`MQTT: Published to ${topic}`);
        resolve();
      });
    });
  }

  // Get the message log
  getMessageLog() {
    return [...this.messageLog];
  }

  // Clear the message log
  clearMessageLog() {
    this.messageLog = [];
  }

  // Get the connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      lastError: this.lastError,
      broker: config.mqtt.broker,
      clientId: config.mqtt.clientId,
      subscriptions: Array.from(this.subscriptions.keys()),
    };
  }
}

// Create a singleton instance
const mqttService = new MqttService();

export default mqttService;
