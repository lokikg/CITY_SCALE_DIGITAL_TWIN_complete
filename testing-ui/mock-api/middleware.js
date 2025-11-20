module.exports = (req, res, next) => {
  // Add random delay to simulate network latency
  setTimeout(() => {
    // Handle test scenario runs
    if (req.method === 'POST' && req.path.match(/\/test-scenarios\/\d+\/run$/)) {
      const id = parseInt(req.path.split('/')[2]);
      const db = req.app.db;
      
      // Find the scenario
      const scenario = db.get('test-scenarios').find({ id }).value();
      
      if (scenario) {
        // Randomly pass or fail the test
        const status = Math.random() > 0.3 ? 'passed' : 'failed';
        
        // Update the scenario
        db.get('test-scenarios')
          .find({ id })
          .assign({ 
            status, 
            lastRun: new Date().toISOString() 
          })
          .write();
        
        res.status(200).json({ success: true, status });
        return;
      }
    }
    
    next();
  }, Math.random() * 1000); // Random delay between 0-1000ms
};
