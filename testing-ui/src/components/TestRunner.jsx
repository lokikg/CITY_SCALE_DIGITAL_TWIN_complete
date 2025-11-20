import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, Play, Info, Clock, RotateCcw } from "lucide-react";
import pythonTestService from '@/services/pythonTestService';

const TestRunner = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [activeTests, setActiveTests] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("api-tests");
  const [pollIntervals, setPollIntervals] = useState({});

  useEffect(() => {
    // Load available tests
    const tests = pythonTestService.getAvailableTests();
    setAvailableTests(tests);
    
    // Cleanup polling intervals on unmount
    return () => {
      Object.values(pollIntervals).forEach(interval => clearInterval(interval));
    };
  }, []);

  // Create a polling mechanism to check test status
  const startPolling = (testId) => {
    // Stop any existing polling for this test
    if (pollIntervals[testId]) {
      clearInterval(pollIntervals[testId]);
    }
    
    // Start polling every 1 second
    const intervalId = setInterval(async () => {
      try {
        const result = await pythonTestService.getTestStatus(testId);
        if (result.success) {
          setActiveTests(prev => ({
            ...prev, 
            [testId]: result.data
          }));
          
          // If test is complete, stop polling
          if (result.data.status !== 'running' && result.data.status !== 'pending') {
            clearInterval(pollIntervals[testId]);
            setPollIntervals(prev => {
              const newIntervals = {...prev};
              delete newIntervals[testId];
              return newIntervals;
            });
          }
        }
      } catch (error) {
        console.error("Error polling test status:", error);
      }
    }, 1000);
    
    // Store the interval ID
    setPollIntervals(prev => ({
      ...prev,
      [testId]: intervalId
    }));
  };

  const runTest = async (testId) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (testId === 'integration') {
        // Run the integration test
        result = await pythonTestService.runIntegrationTests();
      } else {
        // Run a specific named test
        result = await pythonTestService.runNamedTest(testId);
      }
      
      if (result.success) {
        // Add test to active tests
        setActiveTests(prev => ({
          ...prev,
          [result.testId || testId]: {
            id: result.testId || testId,
            status: 'running',
            startTime: new Date().toISOString(),
            command: result.command || '',
            testName: testId
          }
        }));
        
        // Start polling for updates
        startPolling(result.testId || testId);
      } else {
        setError(result.error || 'Failed to run test');
      }
    } catch (error) {
      console.error("Error running test:", error);
      setError('An error occurred while running the test');
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Run each test in sequence
      for (const test of availableTests) {
        if (test.id === 'integration') {
          continue; // Skip integration test when running all
        }
        
        await runTest(test.id);
        // Small delay between test starts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error running all tests:", error);
      setError('An error occurred while running all tests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3.5 w-3.5 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3.5 w-3.5 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Clock className="h-3.5 w-3.5 mr-1 animate-spin" />Running</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3.5 w-3.5 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-500"><Info className="h-3.5 w-3.5 mr-1" />Unknown</Badge>;
    }
  };

  const formatTestOutput = (output) => {
    if (!output) return null;
    
    // Apply syntax highlighting to test output
    const lines = output.split('\n');
    return (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm overflow-x-auto">
        {lines.map((line, i) => {
          // Color for test passes and failures
          if (line.includes(' PASSED ')) {
            return <div key={i} className="text-green-400">{line}</div>;
          } else if (line.includes(' FAILED ')) {
            return <div key={i} className="text-red-400">{line}</div>;
          } else if (line.includes('✅')) {
            return <div key={i} className="text-green-400">{line}</div>;
          } else if (line.includes('❌')) {
            return <div key={i} className="text-red-400">{line}</div>;
          } else if (line.includes('FINAL TEST RESULTS')) {
            return <div key={i} className="text-yellow-400 font-bold">{line}</div>;
          } else {
            return <div key={i}>{line}</div>;
          }
        })}
      </pre>
    );
  };

  const filterTestsByType = (tests, type) => {
    return tests.filter(test => test.type === type);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Runner</CardTitle>
          <CardDescription>
            Run and monitor tests for the City Digital Twin platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="api-tests" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api-tests">API Tests</TabsTrigger>
              <TabsTrigger value="integration-tests">Integration Tests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="api-tests">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Available API Tests</h3>
                  <Button 
                    onClick={runAllTests} 
                    disabled={loading}
                    variant="default"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run All API Tests
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterTestsByType(availableTests, 'api').map(test => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-md">{test.name}</CardTitle>
                          {activeTests[test.id] && getStatusBadge(activeTests[test.id].status)}
                        </div>
                        <CardDescription>{test.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button 
                          onClick={() => runTest(test.id)} 
                          disabled={loading || (activeTests[test.id]?.status === 'running')}
                          variant="outline"
                          className="w-full"
                        >
                          {activeTests[test.id]?.status === 'running' ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Test
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="integration-tests">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Integration Tests</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {filterTestsByType(availableTests, 'integration').map(test => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-md">{test.name}</CardTitle>
                          {activeTests[test.id] && getStatusBadge(activeTests[test.id].status)}
                        </div>
                        <CardDescription>{test.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button 
                          onClick={() => runTest(test.id)} 
                          disabled={loading || (activeTests[test.id]?.status === 'running')}
                          variant="outline"
                          className="w-full"
                        >
                          {activeTests[test.id]?.status === 'running' ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Integration Tests
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Separator className="my-8" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Results</h3>
            
            {Object.values(activeTests).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tests have been run yet. Run a test to see results here.
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {Object.values(activeTests)
                  .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                  .map(test => (
                    <AccordionItem key={test.id} value={test.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 w-full">
                          <span className="flex-1 text-left">
                            {test.testName || `Test ${test.id.substring(0, 8)}`}
                          </span>
                          {getStatusBadge(test.status)}
                          <span className="text-xs text-gray-500">
                            {new Date(test.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {test.status === 'running' && (
                            <Progress value={50} className="h-2 mb-4" />
                          )}
                          
                          {test.summary && (
                            <div className="bg-gray-100 p-4 rounded-md mb-4">
                              <div className="flex gap-4 mb-2">
                                <div className="flex-1">
                                  <span className="font-semibold">Total tests:</span> {test.summary.total}
                                </div>
                                <div className="flex-1">
                                  <span className="font-semibold">Passed:</span> <span className="text-green-600">{test.summary.passed}</span>
                                </div>
                                <div className="flex-1">
                                  <span className="font-semibold">Failed:</span> <span className="text-red-600">{test.summary.failed || (test.summary.total - test.summary.passed)}</span>
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold">Success rate:</span> <span className={test.summary.success_rate === 100 ? "text-green-600" : "text-amber-600"}>{test.summary.success_rate.toFixed(1)}%</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-gray-100 p-4 rounded-md mb-4">
                            <p className="font-semibold">Command:</p>
                            <code className="block text-sm bg-gray-900 text-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {test.command}
                            </code>
                          </div>
                          
                          {test.output && (
                            <div>
                              <p className="font-semibold mb-2">Output:</p>
                              {formatTestOutput(test.output)}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                }
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRunner;
