import express from "express";
import cors from "cors";
import {DatabaseConfig} from "./config/database";
import dotenv from "dotenv";
import callRoutes from "./routes/callRoutes";
import helpRequestRoutes from "./routes/helpRequestRoutes";
import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes";

dotenv.config();

const app= express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//req logging
app.use((req, res, next)=>{
    console.log(`${req.method} ${req.path}`);
    next();
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/calls', callRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

DatabaseConfig().catch(console.error);
export default app;