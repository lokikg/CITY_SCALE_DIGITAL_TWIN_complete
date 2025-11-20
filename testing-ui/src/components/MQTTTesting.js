import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Wifi, WifiOff, Send, MessageCircle, RefreshCw, Trash2, Zap,
  Activity, Clock, CheckCircle, AlertCircle, Copy, Play, Pause, Loader
} from 'lucide-react';

const MQTTTesting = () => {
  const [broker, setBroker] = useState('broker.hivemq.com');
  const [port, setPort] = useState('8884');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [useTLS, setUseTLS] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [topic, setTopic] = useState('city/traffic_sensors/test');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [deviceType, setDeviceType] = useState('traffic_sensors');
  const [deviceId, setDeviceId] = useState(`test-${Math.floor(Math.random() * 1000)}`);
  const [qosLevel, setQosLevel] = useState(0);
  
  const clientRef = useRef(null);
  
  const deviceTypes = [
    'traffic_sensors',
    'air_quality_sensors',
    'noise_sensors',
    'weather_stations',
    'smart_meters',
    'waste_bins',
    'parking_sensors',
    'street_lights',
    'public_transport_trackers',
    'surveillance_cameras',
    'water_quality_sensors',
    'energy_grid_sensors'
  ];
  
  // Update topic when device type or ID changes
  useEffect(() => {
    setTopic(`city/${deviceType}/${deviceId}`);
  }, [deviceType, deviceId]);
  
  // Generate sample message based on device type
  useEffect(() => {
    const baseMessage = {
      id: deviceId,
      location: 'Test Location',
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: new Date().toISOString()
    };
    
    const deviceSpecificData = {
      traffic_sensors: {
        vehicle_count: Math.floor(Math.random() * 100),
        avg_speed: Math.floor(Math.random() * 60) + 20
      },
      air_quality_sensors: {
        pm25: Math.random() * 50,
        pm10: Math.random() * 100,
        no2: Math.random() * 40,
        co: Math.random() * 10
      },
      noise_sensors: {
        decibel_level: Math.random() * 100
      },
      weather_stations: {
        temperature: Math.random() * 40 - 10,
        humidity: Math.random() * 100,
        rainfall: Math.random() * 50,
        wind_speed: Math.random() * 30
      },
      smart_meters: {
        electricity_usage: Math.random() * 500,
        water_usage: Math.random() * 2000
      },
      waste_bins: {
        fill_level: Math.random() * 100,
        temperature: Math.random() * 40
      },
      parking_sensors: {
        is_occupied: Math.random() > 0.5
      },
      street_lights: {
        status: Math.random() > 0.5,
        energy_consumption: Math.random() * 50
      },
      public_transport_trackers: {
        bus_id: `BUS-${Math.floor(Math.random() * 1000)}`,
        occupancy: Math.floor(Math.random() * 50)
      },
      surveillance_cameras: {
        motion_detected: Math.random() > 0.5,
        object_count: Math.floor(Math.random() * 20)
      },
      water_quality_sensors: {
        ph: Math.random() * 14,
        turbidity: Math.random() * 10,
        dissolved_oxygen: Math.random() * 15
      },
      energy_grid_sensors: {
        voltage: 220 + Math.random() * 20,
        current: Math.random() * 50,
        frequency: 50 + Math.random() * 2 - 1
      }
    };
    
    setMessage(JSON.stringify({
      ...baseMessage,
      ...deviceSpecificData[deviceType]
    }, null, 2));
  }, [deviceType, deviceId]);
  
  // Connect to MQTT broker
  const connect = () => {
    if (clientRef.current && clientRef.current.connected) {
      addLog('Already connected');
      return;
    }
    
    const clientId = `mqtt-tester-${Math.random().toString(16).substring(2, 10)}`;
    const protocol = useTLS ? 'wss' : 'ws';
    const url = `${protocol}://${broker}:${port}/mqtt`;
    
    const options = {
      clientId,
      clean: true,
      rejectUnauthorized: false
    };
    
    if (username && password) {
      options.username = username;
      options.password = password;
    }
    
    addLog(`Connecting to ${url}...`);
    
    try {
      const client = mqtt.connect(url, options);
      
      client.on('connect', () => {
        addLog('Connected successfully');
        setIsConnected(true);
      });
      
      client.on('error', (err) => {
        addLog(`Connection error: ${err.message}`);
        setIsConnected(false);
      });
      
      client.on('message', (topic, message) => {
        const payload = message.toString();
        addLog(`Received message on topic: ${topic}`);
        
        try {
          const parsedMessage = JSON.parse(payload);
          
          setReceivedMessages(prev => [{
            id: crypto.randomUUID(),
            topic,
            payload: parsedMessage,
            timestamp: new Date().toISOString()
          }, ...prev]);
        } catch (err) {
          setReceivedMessages(prev => [{
            id: crypto.randomUUID(),
            topic,
            payload,
            timestamp: new Date().toISOString()
          }, ...prev]);
        }
      });
      
      client.on('reconnect', () => {
        addLog('Attempting to reconnect...');
      });
      
      client.on('disconnect', () => {
        addLog('Disconnected');
        setIsConnected(false);
      });
      
      client.on('close', () => {
        addLog('Connection closed');
        setIsConnected(false);
      });
      
      clientRef.current = client;
    } catch (err) {
      addLog(`Error creating connection: ${err.message}`);
    }
  };
  
  // Disconnect from MQTT broker
  const disconnect = () => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.end();
      addLog('Disconnected from broker');
      setIsConnected(false);
    } else {
      addLog('Not connected');
    }
  };
  
  // Subscribe to a topic
  const subscribe = () => {
    if (!clientRef.current || !clientRef.current.connected) {
      addLog('Not connected to broker');
      return;
    }
    
    if (!topic) {
      addLog('Topic cannot be empty');
      return;
    }
    
    if (subscriptions.includes(topic)) {
      addLog(`Already subscribed to ${topic}`);
      return;
    }
    
    clientRef.current.subscribe(topic, { qos: parseInt(qosLevel) }, (err) => {
      if (err) {
        addLog(`Error subscribing to ${topic}: ${err.message}`);
      } else {
        addLog(`Subscribed to ${topic} with QoS ${qosLevel}`);
        setSubscriptions(prev => [...prev, topic]);
      }
    });
  };
  
  // Unsubscribe from a topic
  const unsubscribe = (topicToUnsub) => {
    if (!clientRef.current || !clientRef.current.connected) {
      addLog('Not connected to broker');
      return;
    }
    
    const topicToUnsubscribe = topicToUnsub || topic;
    
    clientRef.current.unsubscribe(topicToUnsubscribe, (err) => {
      if (err) {
        addLog(`Error unsubscribing from ${topicToUnsubscribe}: ${err.message}`);
      } else {
        addLog(`Unsubscribed from ${topicToUnsubscribe}`);
        setSubscriptions(prev => prev.filter(t => t !== topicToUnsubscribe));
      }
    });
  };
  
  // Publish a message to a topic
  const publish = () => {
    if (!clientRef.current || !clientRef.current.connected) {
      addLog('Not connected to broker');
      return;
    }
    
    if (!topic) {
      addLog('Topic cannot be empty');
      return;
    }
    
    if (!message) {
      addLog('Message cannot be empty');
      return;
    }
    
    try {
      // Try to parse as JSON to validate
      JSON.parse(message);
      
      clientRef.current.publish(topic, message, { qos: parseInt(qosLevel) }, (err) => {
        if (err) {
          addLog(`Error publishing to ${topic}: ${err.message}`);
        } else {
          addLog(`Published message to ${topic}`);
        }
      });
    } catch (err) {
      addLog(`Invalid JSON message: ${err.message}`);
    }
  };
  
  // Generate a random message based on device type
  const generateRandomMessage = () => {
    const baseMessage = {
      id: deviceId,
      location: 'Test Location',
      latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
      longitude: -122.4194 + (Math.random() * 0.1 - 0.05),
      timestamp: new Date().toISOString()
    };
    
    const deviceSpecificData = {
      traffic_sensors: {
        vehicle_count: Math.floor(Math.random() * 100),
        avg_speed: Math.floor(Math.random() * 60) + 20
      },
      air_quality_sensors: {
        pm25: Math.random() * 50,
        pm10: Math.random() * 100,
        no2: Math.random() * 40,
        co: Math.random() * 10
      },
      noise_sensors: {
        decibel_level: Math.random() * 100
      },
      weather_stations: {
        temperature: Math.random() * 40 - 10,
        humidity: Math.random() * 100,
        rainfall: Math.random() * 50,
        wind_speed: Math.random() * 30
      },
      smart_meters: {
        electricity_usage: Math.random() * 500,
        water_usage: Math.random() * 2000
      },
      waste_bins: {
        fill_level: Math.random() * 100,
        temperature: Math.random() * 40
      },
      parking_sensors: {
        is_occupied: Math.random() > 0.5
      },
      street_lights: {
        status: Math.random() > 0.5,
        energy_consumption: Math.random() * 50
      },
      public_transport_trackers: {
        bus_id: `BUS-${Math.floor(Math.random() * 1000)}`,
        occupancy: Math.floor(Math.random() * 50)
      },
      surveillance_cameras: {
        motion_detected: Math.random() > 0.5,
        object_count: Math.floor(Math.random() * 20)
      },
      water_quality_sensors: {
        ph: Math.random() * 14,
        turbidity: Math.random() * 10,
        dissolved_oxygen: Math.random() * 15
      },
      energy_grid_sensors: {
        voltage: 220 + Math.random() * 20,
        current: Math.random() * 50,
        frequency: 50 + Math.random() * 2 - 1
      }
    };
    
    setMessage(JSON.stringify({
      ...baseMessage,
      ...deviceSpecificData[deviceType]
    }, null, 2));
  };
  
  // Run stress test by publishing multiple messages
  const runStressTest = () => {
    if (!clientRef.current || !clientRef.current.connected) {
      addLog('Not connected to broker');
      return;
    }
    
    if (!topic) {
      addLog('Topic cannot be empty');
      return;
    }
    
    const numMessages = 10;
    const interval = 200; // ms between messages
    
    addLog(`Starting stress test: sending ${numMessages} messages with ${interval}ms interval`);
    
    let count = 0;
    const testInterval = setInterval(() => {
      if (count >= numMessages) {
        clearInterval(testInterval);
        addLog('Stress test completed');
        return;
      }
      
      const baseMessage = {
        id: deviceId,
        location: 'Test Location',
        latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
        longitude: -122.4194 + (Math.random() * 0.1 - 0.05),
        timestamp: new Date().toISOString()
      };
      
      const deviceSpecificData = {
        traffic_sensors: {
          vehicle_count: Math.floor(Math.random() * 100),
          avg_speed: Math.floor(Math.random() * 60) + 20
        },
        air_quality_sensors: {
          pm25: Math.random() * 50,
          pm10: Math.random() * 100,
          no2: Math.random() * 40,
          co: Math.random() * 10
        },
        noise_sensors: {
          decibel_level: Math.random() * 100
        },
        weather_stations: {
          temperature: Math.random() * 40 - 10,
          humidity: Math.random() * 100,
          rainfall: Math.random() * 50,
          wind_speed: Math.random() * 30
        },
        smart_meters: {
          electricity_usage: Math.random() * 500,
          water_usage: Math.random() * 2000
        },
        waste_bins: {
          fill_level: Math.random() * 100,
          temperature: Math.random() * 40
        },
        parking_sensors: {
          is_occupied: Math.random() > 0.5
        },
        street_lights: {
          status: Math.random() > 0.5,
          energy_consumption: Math.random() * 50
        },
        public_transport_trackers: {
          bus_id: `BUS-${Math.floor(Math.random() * 1000)}`,
          occupancy: Math.floor(Math.random() * 50)
        },
        surveillance_cameras: {
          motion_detected: Math.random() > 0.5,
          object_count: Math.floor(Math.random() * 20)
        },
        water_quality_sensors: {
          ph: Math.random() * 14,
          turbidity: Math.random() * 10,
          dissolved_oxygen: Math.random() * 15
        },
        energy_grid_sensors: {
          voltage: 220 + Math.random() * 20,
          current: Math.random() * 50,
          frequency: 50 + Math.random() * 2 - 1
        }
      };
      
      const testMessage = JSON.stringify({
        ...baseMessage,
        ...deviceSpecificData[deviceType],
        test_id: count + 1
      });
      
      clientRef.current.publish(topic, testMessage, { qos: parseInt(qosLevel) }, (err) => {
        if (err) {
          addLog(`Error publishing test message ${count + 1}: ${err.message}`);
        } else {
          addLog(`Published test message ${count + 1}`);
        }
      });
      
      count++;
    }, interval);
  };
  
  // Helper to add log messages
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Helper to copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.end();
      }
    };
  }, []);
  
  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="title-large text-gradient">MQTT Testing</h1>
            </div>
            <p className="text-muted-foreground">Real-time messaging with MQTT broker</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <Badge className={isConnected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
        {/* Connection Configuration */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-primary" />
              <CardTitle>Connection Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="broker" className="text-sm font-semibold mb-2 block">Broker Host</Label>
                <Input
                  id="broker"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  placeholder="broker.hivemq.com"
                  className="bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="port" className="text-sm font-semibold mb-2 block">Port</Label>
                <Input
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="8884"
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-sm font-semibold mb-2 block">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="(Optional)"
                  className="bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-semibold mb-2 block">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="(Optional)"
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
              <input
                type="checkbox"
                id="useTLS"
                checked={useTLS}
                onChange={(e) => setUseTLS(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer"
              />
              <Label htmlFor="useTLS" className="text-sm font-medium cursor-pointer">Use TLS/SSL Encryption</Label>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                onClick={connect}
                disabled={isConnected}
                size="lg"
                className="flex-1 gap-2 gradient-primary text-white button-hover"
              >
                <Wifi className="w-4 h-4" />
                {isConnected ? 'Connected' : 'Connect'}
              </Button>
              <Button
                onClick={disconnect}
                disabled={!isConnected}
                size="lg"
                variant="destructive"
                className="flex-1 gap-2"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* MQTT Message Publisher */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-primary" />
              <CardTitle>Message Publisher</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceType" className="text-sm font-semibold mb-2 block">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deviceId" className="text-sm font-semibold mb-2 block">Device ID</Label>
                <Input
                  id="deviceId"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="device-001"
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="topic" className="text-sm font-semibold mb-2 block">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="city/sensors/device"
                className="bg-muted/50 border-border"
              />
            </div>

            <div>
              <Label htmlFor="qos" className="text-sm font-semibold mb-2 block">QoS Level</Label>
              <Select value={qosLevel.toString()} onValueChange={(value) => setQosLevel(parseInt(value))}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - At most once (Fire & Forget)</SelectItem>
                  <SelectItem value="1">1 - At least once (Acknowledged)</SelectItem>
                  <SelectItem value="2">2 - Exactly once (Guaranteed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="message" className="text-sm font-semibold">Message (JSON)</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(message)}
                  className="text-xs gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <Textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-mono text-sm bg-muted/50 border-border"
                placeholder='{"sensor_id": "001", "value": 25.5}'
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={publish}
                disabled={!isConnected}
                size="sm"
                className="gap-2 gradient-primary text-white"
              >
                <Send className="w-4 h-4" />
                Publish
              </Button>
              <Button
                onClick={generateRandomMessage}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Generate
              </Button>
              <Button
                onClick={runStressTest}
                disabled={!isConnected}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Stress Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Topic Subscriptions */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>Topic Subscriptions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic to subscribe"
                className="flex-1 bg-muted/50 border-border"
              />
              <Button
                onClick={subscribe}
                disabled={!isConnected}
                size="sm"
                className="gap-2 gradient-primary text-white"
              >
                <MessageCircle className="w-4 h-4" />
                Sub
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Active Subscriptions ({subscriptions.length})</p>
              {subscriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground italic py-8 text-center">No active subscriptions</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subscriptions.map((sub, index) => (
                    <div key={index} className="flex justify-between items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <span className="text-sm font-mono truncate">{sub}</span>
                      <Button
                        onClick={() => unsubscribe(sub)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Common Topics</p>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                {deviceTypes.map(type => (
                  <Button
                    key={type}
                    onClick={() => setTopic(`city/${type}/#`)}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left h-auto p-2 text-xs"
                  >
                    <span className="truncate">city/{type}/#</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Logs */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Activity Logs</CardTitle>
              </div>
              <Button
                onClick={() => setLogs([])}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80 bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-1 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-400 italic">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-slate-300 hover:text-slate-100 transition-colors">
                    <span className="text-slate-500">[{index + 1}]</span> {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Received Messages */}
      <Card className="glass-effect border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <CardTitle>Received Messages</CardTitle>
              <Badge className="ml-2">{receivedMessages.length}</Badge>
            </div>
            {receivedMessages.length > 0 && (
              <Button
                onClick={() => setReceivedMessages([])}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {receivedMessages.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No messages received yet</p>
              <p className="text-sm text-muted-foreground mt-1">Subscribe to topics to see incoming messages</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {receivedMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="group rounded-lg border border-border glass-effect p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded bg-primary/10 flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-muted-foreground truncate">{msg.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(typeof msg.payload === 'object' ? JSON.stringify(msg.payload, null, 2) : msg.payload)}
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-2 rounded text-xs overflow-auto max-h-32 font-mono border border-slate-800">
                    {typeof msg.payload === 'object'
                      ? JSON.stringify(msg.payload, null, 2)
                      : msg.payload
                    }
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MQTTTesting;
