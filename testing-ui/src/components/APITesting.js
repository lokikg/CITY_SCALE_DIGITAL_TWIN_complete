import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { 
  Play, Copy, Download, RefreshCw, AlertCircle, CheckCircle, 
  Clock, Database, Zap, Code, Send, Loader 
} from 'lucide-react';

const APITesting = () => {
  const [endpoint, setEndpoint] = useState('/api/sensors');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('{"Content-Type": "application/json"}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predefinedEndpoints = [
    { name: 'Get All Sensors', method: 'GET', endpoint: '/api/sensors', body: '' },
    { name: 'Get Sensor by ID', method: 'GET', endpoint: '/api/sensors/1', body: '' },
    { name: 'Create Sensor', method: 'POST', endpoint: '/api/sensors', body: '{"name": "Test Sensor", "type": "temperature", "location": "Room 1"}' },
    { name: 'Update Sensor', method: 'PUT', endpoint: '/api/sensors/1', body: '{"name": "Updated Sensor", "type": "temperature", "location": "Room 2"}' },
    { name: 'Delete Sensor', method: 'DELETE', endpoint: '/api/sensors/1', body: '' },
    { name: 'Get Sensor Data', method: 'GET', endpoint: '/api/sensors/1/data', body: '' },
    { name: 'Add Sensor Data', method: 'POST', endpoint: '/api/sensors/1/data', body: '{"value": 25.5, "timestamp": "2023-01-01T12:00:00Z"}' }
  ];

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestOptions = {
        method: method,
        headers: JSON.parse(headers),
      };

      if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
        requestOptions.body = body;
      }

      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const fullUrl = `${baseUrl}${endpoint}`;
      
      const startTime = Date.now();
      const res = await fetch(fullUrl, requestOptions);
      const endTime = Date.now();
      
      const responseData = await res.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch (e) {
        parsedData = responseData;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: parsedData,
        responseTime: endTime - startTime,
        size: new Blob([responseData]).size
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTest = (test) => {
    setEndpoint(test.endpoint);
    setMethod(test.method);
    setBody(test.body);
  };

  const getStatusBadgeVariant = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-300';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (status >= 500) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status >= 300 && status < 400) return <Zap className="w-5 h-5 text-blue-600" />;
    if (status >= 400 && status < 500) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (status >= 500) return <AlertCircle className="w-5 h-5 text-red-600" />;
    return null;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h1 className="title-large text-gradient">API Testing</h1>
            </div>
            <p className="text-muted-foreground">Test and explore API endpoints in real-time</p>
          </div>
          <Badge variant="outline" className="text-sm">Interactive Explorer</Badge>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-6 animate-slide-up">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
          <TabsTrigger value="test" className="gap-2">
            <Send className="w-4 h-4" />
            Manual Test
          </TabsTrigger>
          <TabsTrigger value="predefined" className="gap-2">
            <Zap className="w-4 h-4" />
            Quick Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          {/* Request Configuration Card */}
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-5 h-5 text-primary" />
                <CardTitle>Request Builder</CardTitle>
              </div>
              <CardDescription>Configure and send your API requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* HTTP Method & Endpoint */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="method" className="text-sm font-semibold mb-2 block">
                    HTTP Method
                  </Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="endpoint" className="text-sm font-semibold mb-2 block">
                    Endpoint
                  </Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/sensors"
                    className="bg-muted/50 border-border"
                  />
                </div>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="headers" className="text-sm font-semibold">
                    Headers (JSON)
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(headers)}
                    className="text-xs gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                <Textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={3}
                  placeholder='{"Content-Type": "application/json"}'
                  className="font-mono text-sm bg-muted/50 border-border"
                />
              </div>

              {/* Request Body */}
              {method !== 'GET' && method !== 'DELETE' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="body" className="text-sm font-semibold">
                      Request Body (JSON)
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(body)}
                      className="text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm bg-muted/50 border-border"
                  />
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleTest}
                disabled={loading}
                size="lg"
                className="w-full gradient-primary text-white font-semibold shadow-lg button-hover"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="glass-effect border-l-4 border-red-500 shadow-lg animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Request Error</h3>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Card */}
          {response && (
            <div className="space-y-4 animate-slide-up">
              {/* Response Header Info */}
              <Card className={`glass-effect border-l-4 shadow-lg ${getStatusBadgeVariant(response.status).replace('text-', 'border-').split(' ')[0]}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(response.status)}
                      <div>
                        <p className="text-sm text-muted-foreground">Response Status</p>
                        <p className="text-2xl font-bold">{response.status} {response.statusText}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-6 text-sm">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Response Time</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {response.responseTime}ms
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Response Size</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Database className="w-4 h-4" />
                          {response.size} bytes
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Headers */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Response Headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(response.headers).length} headers received
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(JSON.stringify(response.headers, null, 2))}
                      className="text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Response Body */}
              <Card className="glass-effect border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Response Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                      {typeof response.data === 'string' ? 'Text Content' : 'JSON Content'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2))}
                      className="text-xs gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                    {typeof response.data === 'string'
                      ? response.data
                      : JSON.stringify(response.data, null, 2)
                    }
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!response && !error && !loading && (
            <div className="text-center py-12 animate-fade-in">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Configure your API request above and click "Send Request" to test</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="predefined" className="space-y-6">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>Predefined API Tests</CardTitle>
              </div>
              <CardDescription>Quick access to common API endpoints</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {predefinedEndpoints.map((test, index) => (
                  <div 
                    key={index}
                    className="group flex items-center justify-between p-4 border border-border rounded-lg glass-effect hover:shadow-md hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`font-mono font-bold ${
                            test.method === 'GET'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : test.method === 'POST'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : test.method === 'PUT'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : test.method === 'DELETE'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {test.method}
                        </Badge>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{test.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{test.endpoint}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadPredefinedTest(test)}
                      className="text-primary hover:bg-primary/10 flex-shrink-0 ml-2 gap-1"
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden md:inline">Load</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APITesting;
