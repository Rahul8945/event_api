const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRouter = require('./routes/userRoutes');
const eventRouter = require('./routes/eventRoutes');

const swaggerJSdoc=require("swagger-jsdoc")
const swaggerUi=require("swagger-ui-express")
const app = express();
dotenv.config();
connectDB(process.env.DB_URL);
const db_url = process.env.DB_URL;


const options={
    definition:{
        openapi:"3.0.0",
        info:{
            title:"Learning Swagger",
            version:"1.0.0"
        },
        servers:[
            {
                url:"http://localhost:4000"
            }
        ]
    },
    apis:["./routes/*.js"]
}

const swaggerSpec=swaggerJSdoc(options)
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec))


app.use(cors());
app.use(express.json());

// setupSwagger(app)
app.get('/',(req,res)=>{
    res.send("this is home route")
})

app.use('/api/users', userRouter);
app.use('/api/events', eventRouter);

app.listen(process.env.PORT || 5000,async () => {
    try {
        await connectDB(db_url);
        console.log("db connected");
        console.log(`server running on http://localhost:${process.env.PORT}`);
      } catch (error) {
        console.log(error);
      }
});
