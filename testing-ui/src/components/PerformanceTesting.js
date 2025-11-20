import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import {
  Zap, Play, BarChart3, TrendingUp, Activity, AlertCircle, CheckCircle,
  Settings, Loader, Clock, Gauge, RefreshCw
} from 'lucide-react';

const PerformanceTesting = () => {
  const [targetUrl, setTargetUrl] = useState('http://localhost:8000/api');
  const [concurrentUsers, setConcurrentUsers] = useState(10);
  const [duration, setDuration] = useState(30);
  const [rampUp, setRampUp] = useState(5);
  const [testEndpoint, setTestEndpoint] = useState('/traffic_sensors/all');
  const [method, setMethod] = useState('GET');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  
  // Available test scenarios
  const testScenarios = [
    { name: 'GET All Traffic Sensors', endpoint: '/traffic_sensors/all', method: 'GET' },
    { name: 'GET All Air Quality Sensors', endpoint: '/air_quality_sensors/all', method: 'GET' },
    { name: 'GET Single Traffic Sensor', endpoint: '/traffic_sensors/1', method: 'GET' },
    { name: 'POST New Traffic Sensor', endpoint: '/traffic_sensors/add', method: 'POST' },
    { name: 'Health Check', endpoint: '/health', method: 'GET' },
    { name: 'Custom Endpoint', endpoint: '/custom', method: 'GET' },
  ];

  const handleScenarioChange = (scenario) => {
    setTestEndpoint(scenario.endpoint);
    setMethod(scenario.method);
  };
  
  // Start performance test
  const startTest = () => {
    setLoading(true);
    setError(null);
    
    // In a real application, this would call a backend service that runs JMeter or similar
    // For this demo, we'll simulate the test results
    
    setTimeout(() => {
      try {
        // Generate simulated test results
        const testDuration = Math.floor(duration * (0.9 + Math.random() * 0.2)); // Actual duration with slight variance
        const totalRequests = Math.floor(concurrentUsers * (duration / 5) * (10 + Math.random() * 10)); // Roughly 10-20 req/s per user
        const successfulRequests = Math.floor(totalRequests * (0.9 + Math.random() * 0.1)); // 90-100% success rate
        const failedRequests = totalRequests - successfulRequests;
        
        // Response time stats (ms)
        const avgResponseTime = Math.floor(50 + Math.random() * 150);
        const minResponseTime = Math.floor(avgResponseTime * 0.5);
        const maxResponseTime = Math.floor(avgResponseTime * (2 + Math.random() * 3));
        const p90ResponseTime = Math.floor(avgResponseTime * 1.5);
        const p95ResponseTime = Math.floor(avgResponseTime * 1.8);
        const p99ResponseTime = Math.floor(avgResponseTime * 2.2);
        
        // Throughput (req/s)
        const throughput = parseFloat((totalRequests / testDuration).toFixed(2));
        
        // Error rate
        const errorRate = parseFloat(((failedRequests / totalRequests) * 100).toFixed(2));
        
        // Generate response time distribution
        const responseTimeDistribution = [
          { range: '0-100ms', count: Math.floor(totalRequests * 0.35) },
          { range: '100-200ms', count: Math.floor(totalRequests * 0.25) },
          { range: '200-300ms', count: Math.floor(totalRequests * 0.15) },
          { range: '300-500ms', count: Math.floor(totalRequests * 0.1) },
          { range: '500-1000ms', count: Math.floor(totalRequests * 0.1) },
          { range: '1000ms+', count: Math.floor(totalRequests * 0.05) },
        ];
        
        // Generate response code distribution
        const responseCodeDistribution = [
          { code: '200 OK', count: successfulRequests },
          { code: '404 Not Found', count: Math.floor(failedRequests * 0.3) },
          { code: '500 Server Error', count: Math.floor(failedRequests * 0.5) },
          { code: '503 Service Unavailable', count: Math.floor(failedRequests * 0.2) },
        ];
        
        const simulatedResults = {
          testId: crypto.randomUUID(),
          testStartTime: new Date(Date.now() - testDuration * 1000).toISOString(),
          testEndTime: new Date().toISOString(),
          targetUrl: targetUrl + testEndpoint,
          method,
            concurrentUsers,
          duration: testDuration,
          rampUp,
          totalRequests,
          successfulRequests,
          failedRequests,
          avgResponseTime,
          minResponseTime,
          maxResponseTime,
          p90ResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          throughput,
          errorRate,
          responseTimeDistribution,
          responseCodeDistribution
        };

        setResults(simulatedResults);

        // Add to test history
        setTestHistory(prev => [simulatedResults, ...prev]);
      } catch (e) {
        setError({ message: 'Test simulation failed', details: e.message });
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="title-large text-gradient">Performance Testing</h1>
        </div>
        <p className="text-muted-foreground">Simulate load against your API endpoints with configurable scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
        {/* Test Configuration Card */}
        <Card className="lg:col-span-2 glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Test Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {/* Target URL */}
            <div>
              <Label htmlFor="targetUrl" className="text-sm font-semibold mb-2 block">Target Base URL</Label>
              <Input 
                id="targetUrl" 
                value={targetUrl} 
                onChange={e=>setTargetUrl(e.target.value)} 
                placeholder="http://localhost:8000/api"
                className="bg-muted/50 border-border"
              />
            </div>

            {/* Test Scenario and Method */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Test Scenario</Label>
                <Select value={testEndpoint} onValueChange={(val)=>{ const sc = testScenarios.find(s=>s.endpoint===val); sc && handleScenarioChange(sc); }}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {testScenarios.map(s=> <SelectItem key={s.endpoint} value={s.endpoint}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">HTTP Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET','POST','PUT','DELETE'].map(m=> <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Load Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="users" className="text-sm font-semibold mb-2 block">Concurrent Users</Label>
                <Input 
                  id="users" 
                  type="number" 
                  min={1} 
                  max={1000} 
                  value={concurrentUsers} 
                  onChange={e=>setConcurrentUsers(parseInt(e.target.value||'0'))}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-sm font-semibold mb-2 block">Duration (s)</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  min={1} 
                  max={300} 
                  value={duration} 
                  onChange={e=>setDuration(parseInt(e.target.value||'0'))}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="ramp" className="text-sm font-semibold mb-2 block">Ramp-up (s)</Label>
                <Input 
                  id="ramp" 
                  type="number" 
                  min={0} 
                  max={60} 
                  value={rampUp} 
                  onChange={e=>setRampUp(parseInt(e.target.value||'0'))}
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>

            {/* Start Test Button */}
            <Button 
              onClick={startTest} 
              disabled={loading} 
              size="lg"
              className="w-full gradient-primary text-white font-semibold button-hover"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Performance Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Presets Card */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <CardTitle>Test Presets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-6">
            {[
              {label:'Baseline', users:10,dur:30,ramp:5, idx:0, desc:'10 users · 30s'},
              {label:'Medium Load', users:50,dur:60,ramp:10, idx:0, desc:'50 users · 60s'},
              {label:'High Load', users:100,dur:120,ramp:20, idx:0, desc:'100 users · 120s'},
              {label:'Stress', users:200,dur:180,ramp:30, idx:0, desc:'200 users · 180s'},
              {label:'Endurance', users:5,dur:300,ramp:0, idx:0, desc:'5 users · 300s'},
              {label:'Single Sensor', users:10,dur:30,ramp:5, idx:2, desc:'Single sensor'},
            ].map(p=> (
              <Button 
                key={p.label} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start font-normal h-auto py-2 px-3" 
                onClick={()=>{setConcurrentUsers(p.users);setDuration(p.dur);setRampUp(p.ramp);handleScenarioChange(testScenarios[p.idx]);}}
              >
                <span className="font-semibold mr-2 text-sm">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Test Results Card */}
      <Card className="glass-effect border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Test Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">{error.message}</p>
                  {error.details && <pre className="text-xs whitespace-pre-wrap opacity-90 mt-1">{error.details}</pre>}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-primary rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-gradient-primary rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-semibold text-foreground">Running performance test...</p>
              <p className="text-sm text-muted-foreground">Please wait while we simulate load</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {label:'Throughput', value:`${results.throughput} req/s`, icon: TrendingUp, color: 'text-blue-600'},
                  {label:'Avg Response', value:`${results.avgResponseTime} ms`, icon: Clock, color: 'text-green-600'},
                  {label:'Total Requests', value:results.totalRequests, icon: Activity, color: 'text-purple-600'},
                  {label:'Error Rate', value:`${results.errorRate}%`, icon: AlertCircle, color: results.errorRate > 5 ? 'text-red-600' : 'text-yellow-600'},
                ].map(k=> {
                  const Icon = k.icon;
                  return (
                    <div key={k.label} className="rounded-lg border border-border glass-effect p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{k.label}</p>
                        <Icon className={`w-4 h-4 ${k.color}`} />
                      </div>
                      <p className="text-2xl font-bold">{k.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Response Time Stats & Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Response Time Statistics
                  </h3>
                  <div className="space-y-2">
                    {[['Minimum',results.minResponseTime],['Average',results.avgResponseTime],['90th %ile',results.p90ResponseTime],['95th %ile',results.p95ResponseTime],['99th %ile',results.p99ResponseTime],['Maximum',results.maxResponseTime]].map(r=> (
                      <div key={r[0]} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{r[0]}</span>
                        <span className="text-sm font-mono font-semibold">{r[1]} ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Response Code Distribution
                  </h3>
                  <div className="space-y-2">
                    {results.responseCodeDistribution.map(rc=> (
                      <div key={rc.code} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge className="font-mono text-xs">{rc.code}</Badge>
                          <span className="text-sm">({rc.count} requests)</span>
                        </div>
                        <span className="text-sm font-semibold">{((rc.count/ results.totalRequests)*100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Response Time Distribution Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Response Time Distribution</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 font-semibold">Range</th>
                        <th className="text-left p-2 font-semibold">Count</th>
                        <th className="text-left p-2 font-semibold">Percentage</th>
                        <th className="text-left p-2 font-semibold">Visual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.responseTimeDistribution.map(rt=> (
                        <tr key={rt.range} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-2 font-mono font-semibold">{rt.range}</td>
                          <td className="p-2">{rt.count}</td>
                          <td className="p-2 font-semibold">{((rt.count/ results.totalRequests)*100).toFixed(1)}%</td>
                          <td className="p-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-gradient-primary h-2 rounded-full" style={{ width: `${(rt.count / results.totalRequests) * 100}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No results yet. Run a test to see detailed performance metrics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test History Card */}
      <Card className="glass-effect border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>Test History</CardTitle>
            <Badge className="ml-2">{testHistory.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {testHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No test history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-semibold text-muted-foreground">Date/Time</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Target</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Users</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Throughput</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Avg Resp</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map(test => (
                    <tr key={test.testId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-2 whitespace-nowrap text-xs">{new Date(test.testStartTime).toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap text-xs font-mono">{test.method} {test.targetUrl.split('/').slice(-2).join('/')}</td>
                      <td className="p-2 whitespace-nowrap font-semibold">{test.concurrentUsers}</td>
                      <td className="p-2 whitespace-nowrap font-mono font-semibold">{test.throughput} req/s</td>
                      <td className="p-2 whitespace-nowrap font-mono">{test.avgResponseTime}ms</td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge className={test.errorRate < 1 ? 'bg-green-100 text-green-800 border-green-300' : test.errorRate < 5 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300'}>
                          {test.errorRate}% errors
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTesting;
