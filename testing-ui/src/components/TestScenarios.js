import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlayCircle, PlusCircle, Save, Trash2 } from 'lucide-react';

// Form schema for creating/editing test scenarios
const formSchema = z.object({
  name: z.string().min(3, { message: 'Scenario name must be at least 3 characters' }),
  description: z.string().optional(),
  category: z.string(),
  steps: z.array(
    z.object({
      description: z.string().min(1, { message: 'Step description is required' }),
      expectedOutcome: z.string().min(1, { message: 'Expected outcome is required' }),
    })
  ).min(1, { message: 'At least one step is required' }),
});

const categories = [
  { value: 'api', label: 'API Testing' },
  { value: 'mqtt', label: 'MQTT Testing' },
  { value: 'database', label: 'Database Testing' },
  { value: 'performance', label: 'Performance Testing' },
  { value: 'e2e', label: 'End-to-End Testing' },
  { value: 'system', label: 'System Testing' },
];

const TestScenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [steps, setSteps] = useState([{ description: '', expectedOutcome: '' }]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'api',
      steps: [{ description: '', expectedOutcome: '' }],
    },
  });

  // Fetch test scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/test-scenarios');
        setScenarios(response.data);
      } catch (error) {
        console.error('Error fetching test scenarios:', error);
        toast.error('Failed to load test scenarios');
        // For demo purposes, let's add some mock data
        setScenarios([
          {
            id: 1,
            name: 'Sensor Data API Validation',
            description: 'Verify that sensor data API endpoints return correct data structures',
            category: 'api',
            status: 'passed',
            lastRun: '2023-10-15T14:30:00Z',
            steps: [
              { description: 'Send GET request to /api/sensors', expectedOutcome: 'Status 200 with array of sensors' },
              { description: 'Validate sensor data schema', expectedOutcome: 'All sensors have required fields' },
            ],
          },
          {
            id: 2,
            name: 'MQTT Connection Test',
            description: 'Verify MQTT broker connection and message publishing',
            category: 'mqtt',
            status: 'failed',
            lastRun: '2023-10-14T10:15:00Z',
            steps: [
              { description: 'Connect to MQTT broker', expectedOutcome: 'Connection established' },
              { description: 'Subscribe to test topic', expectedOutcome: 'Subscription successful' },
              { description: 'Publish message to test topic', expectedOutcome: 'Message received by subscriber' },
            ],
          },
          {
            id: 3,
            name: 'Database Query Performance',
            description: 'Measure response time for complex queries',
            category: 'performance',
            status: 'pending',
            lastRun: null,
            steps: [
              { description: 'Run time-series query on sensor data', expectedOutcome: 'Query completes in < 500ms' },
              { description: 'Run aggregation query', expectedOutcome: 'Query completes in < 1s' },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  // Filter scenarios based on active tab
  const filteredScenarios = activeTab === 'all' 
    ? scenarios 
    : scenarios.filter(scenario => scenario.category === activeTab);

  // Add a new step to the form
  const addStep = () => {
    setSteps([...steps, { description: '', expectedOutcome: '' }]);
  };

  // Remove a step from the form
  const removeStep = (index) => {
    const updatedSteps = [...steps];
    updatedSteps.splice(index, 1);
    setSteps(updatedSteps);
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (editingScenario) {
        // Update existing scenario
        await axios.put(`/api/test-scenarios/${editingScenario.id}`, data);
        toast.success('Test scenario updated successfully');
      } else {
        // Create new scenario
        await axios.post('/api/test-scenarios', data);
        toast.success('Test scenario created successfully');
      }
      
      // For demo purposes, update the local state
      if (editingScenario) {
        setScenarios(scenarios.map(s => 
          s.id === editingScenario.id ? { ...s, ...data, status: 'pending', lastRun: null } : s
        ));
      } else {
        setScenarios([...scenarios, { 
          id: scenarios.length + 1, 
          ...data, 
          status: 'pending',
          lastRun: null
        }]);
      }
      
      setIsDialogOpen(false);
      setEditingScenario(null);
      form.reset();
      setSteps([{ description: '', expectedOutcome: '' }]);
    } catch (error) {
      console.error('Error saving test scenario:', error);
      toast.error('Failed to save test scenario');
    }
  };

  // Open the dialog for editing an existing scenario
  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    form.reset({
      name: scenario.name,
      description: scenario.description || '',
      category: scenario.category,
      steps: scenario.steps,
    });
    setSteps(scenario.steps);
    setIsDialogOpen(true);
  };

  // Open the dialog for creating a new scenario
  const handleCreate = () => {
    setEditingScenario(null);
    form.reset({
      name: '',
      description: '',
      category: 'api',
      steps: [{ description: '', expectedOutcome: '' }],
    });
    setSteps([{ description: '', expectedOutcome: '' }]);
    setIsDialogOpen(true);
  };

  // Run a test scenario
  const runScenario = async (id) => {
    try {
      setIsRunning(id);
      // Replace with your actual API endpoint
      await axios.post(`/api/test-scenarios/${id}/run`);
      
      // For demo purposes, update the local state
      setScenarios(scenarios.map(s => 
        s.id === id ? { 
          ...s, 
          status: Math.random() > 0.3 ? 'passed' : 'failed', // Randomly pass or fail
          lastRun: new Date().toISOString() 
        } : s
      ));
      toast.success('Test scenario executed');
    } catch (error) {
      console.error('Error running test scenario:', error);
      toast.error('Failed to run test scenario');
    } finally {
      setIsRunning(false);
    }
  };

  // Delete a test scenario
  const deleteScenario = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test scenario?')) return;
    
    try {
      // Replace with your actual API endpoint
      await axios.delete(`/api/test-scenarios/${id}`);
      
      // Update the local state
      setScenarios(scenarios.filter(s => s.id !== id));
      toast.success('Test scenario deleted');
    } catch (error) {
      console.error('Error deleting test scenario:', error);
      toast.error('Failed to delete test scenario');
    }
  };

  // Get status badge based on scenario status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Scenarios</h1>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Scenario
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Scenarios</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="mqtt">MQTT</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="e2e">E2E</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">No test scenarios found in this category</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Scenario
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScenarios.map((scenario) => (
                <Card key={scenario.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{scenario.name}</CardTitle>
                      {getStatusBadge(scenario.status)}
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Steps ({scenario.steps.length})</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {scenario.steps.slice(0, 2).map((step, index) => (
                          <li key={index}>{step.description}</li>
                        ))}
                        {scenario.steps.length > 2 && (
                          <li className="text-gray-500">
                            + {scenario.steps.length - 2} more steps
                          </li>
                        )}
                      </ul>
                    </div>
                    {scenario.lastRun && (
                      <p className="text-sm text-gray-500">
                        Last run: {new Date(scenario.lastRun).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(scenario)}
                    >
                      Edit
                    </Button>
                    <div className="space-x-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => runScenario(scenario.id)}
                        disabled={isRunning === scenario.id}
                      >
                        {isRunning === scenario.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="mr-2 h-4 w-4" />
                        )}
                        Run
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing test scenarios */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? 'Edit Test Scenario' : 'Create New Test Scenario'}
            </DialogTitle>
            <DialogDescription>
              Define your test scenario with detailed steps and expected outcomes.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter scenario name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the purpose of this test scenario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel className="text-base">Test Steps</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}>
                    Add Step
                  </Button>
                </div>
                
                {steps.map((step, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      {steps.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`steps.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What should be done in this step" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`steps.${index}.expectedOutcome`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Outcome</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What should happen as a result" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                {form.formState.errors.steps && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.steps.message}
                  </p>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingScenario ? 'Update Scenario' : 'Create Scenario'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestScenarios;
