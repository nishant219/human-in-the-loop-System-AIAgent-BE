import app from "./app";

const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
})