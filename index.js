require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const authRouter = require('./authRouter')
const PORT = process.env.PORT

const app = express()

app.use(express.json())
app.use("/auth", authRouter)
const start = async () => {
    try {
        await mongoose.connect(`mongodb+srv://perevozke:tp7ldamVoPaPwiLH@cluster0.f3p5zte.mongodb.net/auth_roles?retryWrites=true&w=majority`)
        app.listen(PORT, () => console.log('test'))
    } catch (e) {
        console.log(e);
    }

}

start()