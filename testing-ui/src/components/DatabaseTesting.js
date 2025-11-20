import React, { useState } from 'react';
import apiService from '../services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const DatabaseTesting = () => {
	const [query, setQuery] = useState('SELECT * FROM traffic_sensors LIMIT 10;');
	const [dbType, setDbType] = useState('postgres');
	const [host, setHost] = useState('localhost');
	const [port, setPort] = useState('5432');
	const [database, setDatabase] = useState('cityiot');
	const [username, setUsername] = useState('postgres');
	const [password, setPassword] = useState('');
	const [results, setResults] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [testResults, setTestResults] = useState([]);
	const [tables, setTables] = useState([]);
	const [tablesLoading, setTablesLoading] = useState(false);

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

	// Execute query against backend database test endpoint
	const executeQuery = async () => {
		setLoading(true);
		setError(null);
		setResults(null);

		try {
			const payload = {
				query,
				readOnly: true
			};

			const response = await apiService.tests.runDatabaseTest(payload);
			setResults(response.data);

			setTestResults(prev => [
				{
					id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`,
					query,
					timestamp: new Date().toISOString(),
					status: 'Success',
					rowCount: response.data.rowCount || (response.data.rows && response.data.rows.length) || 0
				},
				...prev
			]);
		} catch (err) {
			setError({
				message: err.message,
				details: err.response ? err.response.data : null
			});

			setTestResults(prev => [
				{
					id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`,
					query,
					timestamp: new Date().toISOString(),
					status: 'Error',
					error: err.message
				},
				...prev
			]);
		} finally {
			setLoading(false);
		}
	};

	// Load schema/tables from backend
	const loadTables = async () => {
		setTablesLoading(true);
		setTables([]);

		try {
			const res = await apiService.sendRequest('get', '/api/tests/database/schema');
			if (res && res.data && res.data.tables) {
				setTables(res.data.tables.map(t => ({ name: t.name, schema: 'public', type: 'table' })));
			} else {
				// Fallback: use deviceTypes
				setTables(deviceTypes.map(type => ({ name: type, schema: 'public', type: 'table' })));
			}
		} catch (err) {
			// Fallback to mocked tables on error
			setTables(deviceTypes.map(type => ({ name: type, schema: 'public', type: 'table' })));
		} finally {
			setTablesLoading(false);
		}
	};

	// Simulate query execution (keeps previous demo behavior if backend not available)
	const simulateQueryExecution = () => {
		setLoading(true);
		setError(null);

		setTimeout(() => {
			try {
				// Simulate a successful query result
				const mockData = generateMockResults(query);
				setResults(mockData);

				setTestResults(prev => [
					{
						id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`,
						query,
						timestamp: new Date().toISOString(),
						status: 'Success',
						rowCount: mockData.rows.length
					},
					...prev
				]);
			} catch (err) {
				setError({ message: 'Error executing query', details: { error: 'Syntax error in SQL query' } });
				setTestResults(prev => [
					{
						id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`,
						query,
						timestamp: new Date().toISOString(),
						status: 'Error',
						error: 'Syntax error in SQL query'
					},
					...prev
				]);
			} finally {
				setLoading(false);
			}
		}, 800);
	};

	// Generate mock results (same logic as backup)
	const generateMockResults = (queryStr) => {
		const table = deviceTypes.find(type => queryStr.toLowerCase().includes(type));

		if (!table) {
			return { rows: [], columns: [], rowCount: 0 };
		}

		const columns = ['id', 'location', 'latitude', 'longitude', 'timestamp'];
		switch (table) {
			case 'traffic_sensors': columns.push('vehicle_count', 'avg_speed'); break;
			case 'air_quality_sensors': columns.push('pm25', 'pm10', 'no2', 'co'); break;
			case 'noise_sensors': columns.push('decibel_level'); break;
			case 'weather_stations': columns.push('temperature', 'humidity', 'rainfall', 'wind_speed'); break;
			case 'smart_meters': columns.push('electricity_usage', 'water_usage'); break;
			case 'waste_bins': columns.push('fill_level', 'temperature'); break;
			case 'parking_sensors': columns.push('is_occupied'); break;
			case 'street_lights': columns.push('status', 'energy_consumption'); break;
			case 'public_transport_trackers': columns.push('bus_id', 'occupancy'); break;
			case 'surveillance_cameras': columns.push('motion_detected', 'object_count'); break;
			case 'water_quality_sensors': columns.push('ph', 'turbidity', 'dissolved_oxygen'); break;
			case 'energy_grid_sensors': columns.push('voltage', 'current', 'frequency'); break;
			default: break;
		}

		const numRows = queryStr.toLowerCase().includes('limit') ? parseInt(queryStr.match(/limit\s+(\d+)/i)?.[1] || '10') : 10;
		const rows = [];
		for (let i = 0; i < numRows; i++) {
			const row = { id: `${Date.now()}-${i}`, location: `Location ${i + 1}`, latitude: 37.7749 + (Math.random() * 0.1 - 0.05), longitude: -122.4194 + (Math.random() * 0.1 - 0.05), timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() };
			switch (table) {
				case 'traffic_sensors': row.vehicle_count = Math.floor(Math.random() * 100); row.avg_speed = Math.floor(Math.random() * 60) + 20; break;
				case 'air_quality_sensors': row.pm25 = Math.random() * 50; row.pm10 = Math.random() * 100; row.no2 = Math.random() * 40; row.co = Math.random() * 10; break;
				case 'noise_sensors': row.decibel_level = Math.random() * 100; break;
				case 'weather_stations': row.temperature = Math.random() * 40 - 10; row.humidity = Math.random() * 100; row.rainfall = Math.random() * 50; row.wind_speed = Math.random() * 30; break;
				case 'smart_meters': row.electricity_usage = Math.random() * 500; row.water_usage = Math.random() * 2000; break;
				case 'waste_bins': row.fill_level = Math.random() * 100; row.temperature = Math.random() * 40; break;
				case 'parking_sensors': row.is_occupied = Math.random() > 0.5; break;
				case 'street_lights': row.status = Math.random() > 0.5; row.energy_consumption = Math.random() * 50; break;
				case 'public_transport_trackers': row.bus_id = `BUS-${Math.floor(Math.random() * 1000)}`; row.occupancy = Math.floor(Math.random() * 50); break;
				case 'surveillance_cameras': row.motion_detected = Math.random() > 0.5; row.object_count = Math.floor(Math.random() * 20); break;
				case 'water_quality_sensors': row.ph = Math.random() * 14; row.turbidity = Math.random() * 10; row.dissolved_oxygen = Math.random() * 15; break;
				case 'energy_grid_sensors': row.voltage = 220 + Math.random() * 20; row.current = Math.random() * 50; row.frequency = 50 + Math.random() * 2 - 1; break;
				default: break;
			}
			rows.push(row);
		}

		return { rows, columns, rowCount: rows.length };
	};

	// Run a set of pre-defined tests
	const runAllTests = () => {
		setTestResults([]);
		const runTest = (q) => {
			setQuery(q);
			simulateQueryExecution();
		};

		const templates = [
			`SELECT * FROM traffic_sensors LIMIT 10;`,
			`SELECT COUNT(*) FROM traffic_sensors;`,
			`SELECT * FROM traffic_sensors ORDER BY timestamp DESC LIMIT 5;`,
		];

		templates.forEach((t, idx) => setTimeout(() => runTest(t), idx * 1200));
	};

	const setQueryTemplate = (queryTemplate, table = 'traffic_sensors') => {
		const q = queryTemplate.includes('{table}') ? queryTemplate.replace('{table}', table) : queryTemplate;
		setQuery(q);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Database Testing</h1>
				<Badge variant="outline" className="text-sm">Query Interface</Badge>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Connection Settings</CardTitle>
						<CardDescription>Configure DB connection parameters (for display)</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="dbType">Database Type</Label>
							<Select value={dbType} onValueChange={setDbType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="postgres">PostgreSQL</SelectItem>
									<SelectItem value="mongodb">MongoDB</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="host">Host</Label>
								<Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="localhost" />
							</div>
							<div>
								<Label htmlFor="port">Port</Label>
								<Input id="port" value={port} onChange={(e) => setPort(e.target.value)} placeholder="5432" />
							</div>
						</div>

						<div>
							<Label htmlFor="database">Database Name</Label>
							<Input id="database" value={database} onChange={(e) => setDatabase(e.target.value)} placeholder="cityiot" />
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="username">Username</Label>
								<Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="postgres" />
							</div>
							<div>
								<Label htmlFor="password">Password</Label>
								<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
							</div>
						</div>

						<Button onClick={loadTables} disabled={tablesLoading} className="w-full">{tablesLoading ? 'Loading...' : 'Load Tables'}</Button>
					</CardContent>
				</Card>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">Database Schema</h2>

					{tablesLoading ? (
						<div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
					) : tables.length === 0 ? (
						<div className="text-gray-400 text-center py-8">No schema loaded. Connect to the database to see tables.</div>
					) : (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-700 mb-2">Tables</h3>
							<div className="max-h-64 overflow-y-auto">
								{tables.map((table) => (
									<div key={table.name} className="flex justify-between items-center bg-gray-50 p-2 rounded-md mb-2 cursor-pointer hover:bg-gray-100" onClick={() => setQueryTemplate('SELECT * FROM {table} LIMIT 10;', table.name)}>
										<div className="flex items-center"><span className="text-sm font-medium">{table.name}</span><span className="text-xs text-gray-500 ml-2">{table.schema}</span></div>
										<div className="flex gap-2">
											<button onClick={(e) => { e.stopPropagation(); setQueryTemplate('SELECT * FROM {table} LIMIT 10;', table.name); }} className="text-xs text-blue-600 hover:text-blue-800">Select</button>
											<button onClick={(e) => { e.stopPropagation(); setQueryTemplate('SELECT COUNT(*) FROM {table};', table.name); }} className="text-xs text-blue-600 hover:text-blue-800">Count</button>
											<button onClick={(e) => { e.stopPropagation(); setQueryTemplate('SELECT * FROM {table} ORDER BY timestamp DESC LIMIT 5;', table.name); }} className="text-xs text-blue-600 hover:text-blue-800">Recent</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="mt-6">
						<h3 className="text-sm font-medium text-gray-700 mb-2">Sample Queries</h3>
						<div className="space-y-2">
							<button onClick={() => setQueryTemplate('SELECT * FROM {table} LIMIT 10;')} className="w-full text-left text-sm bg-gray-50 hover:bg-gray-100 p-2 rounded-md">Select All (with limit)</button>
							<button onClick={() => setQueryTemplate('SELECT COUNT(*) FROM {table};')} className="w-full text-left text-sm bg-gray-50 hover:bg-gray-100 p-2 rounded-md">Count Records</button>
							<button onClick={() => setQueryTemplate('SELECT * FROM {table} ORDER BY timestamp DESC LIMIT 5;')} className="w-full text-left text-sm bg-gray-50 hover:bg-gray-100 p-2 rounded-md">Most Recent Records</button>
						</div>
					</div>

					<div className="mt-6">
						<button onClick={runAllTests} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md">Run All Test Queries</button>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">Query Editor</h2>
					<div className="mb-4">
						<Textarea rows={8} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm" />
					</div>
					<div className="flex gap-3">
						<Button onClick={executeQuery} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">{loading ? 'Executing...' : 'Execute Query'}</Button>
						<Button onClick={simulateQueryExecution} disabled={loading} className="bg-gray-200">Simulate</Button>
					</div>
				</div>
			</div>

			<div className="mt-8 bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-semibold text-gray-700 mb-4">Query Results</h2>
				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
						<h3 className="text-md font-medium text-red-800 mb-2">Error</h3>
						<p className="text-sm text-red-700">{error.message}</p>
						{error.details && <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">{JSON.stringify(error.details, null, 2)}</pre>}
					</div>
				)}

				{loading ? (
					<div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
				) : results ? (
					<div>
						{results.message ? (
							<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
								<p className="text-sm text-green-700">{results.message}</p>
								<p className="text-sm text-green-700">Affected rows: {results.rowCount}</p>
							</div>
						) : results.rows && results.rows.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50"><tr>{(results.columns || Object.keys(results.rows[0])).map((column, index) => (<th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{column}</th>))}</tr></thead>
									<tbody className="bg-white divide-y divide-gray-200">{results.rows.map((row, rowIndex) => (<tr key={rowIndex}>{(results.columns || Object.keys(results.rows[0])).map((column, colIndex) => (<td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row[column] !== null && row[column] !== undefined ? typeof row[column] === 'boolean' ? row[column].toString() : row[column] : <span className="text-gray-400">NULL</span>}</td>))}</tr>))}</tbody>
								</table>
								<div className="mt-4 text-sm text-gray-500">{results.rowCount || results.rows.length} rows returned</div>
							</div>
						) : (
							<div className="text-gray-400 text-center py-8">Query executed successfully, but no results were returned.</div>
						)}
					</div>
				) : (
					<div className="text-gray-400 text-center py-8">No results yet. Execute a query to see results.</div>
				)}
			</div>

			<div className="mt-8 bg-white rounded-lg shadow-md p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-700">Test Results</h2>
					<button onClick={() => setTestResults([])} className="text-sm text-gray-600 hover:text-gray-900">Clear Results</button>
				</div>

				{testResults.length === 0 ? (
					<div className="text-gray-400 text-center py-8">No test results yet. Execute queries to see results here.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th></tr></thead>
							<tbody className="bg-white divide-y divide-gray-200">{testResults.map((result) => (<tr key={result.id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div className="max-w-lg truncate">{result.query}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 text-xs font-medium rounded ${result.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{result.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.status === 'Success' ? `${result.rowCount} rows` : result.error}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(result.timestamp).toLocaleString()}</td></tr>))}</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default DatabaseTesting;
