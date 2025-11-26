const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB
const mongoURI = 'mongodb+srv://kgadiselepe:Yehovah100@my-projects.kheii.mongodb.net/PromathsForm?retryWrites=true&w=majority&appName=My-Projects';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Updated Student Schema
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    studentNumber: { type: String, required: true },
    yearOfStudy: { 
        type: String, 
        required: true,
        enum: ['High School', 'First year', 'Second year', 'Third year', 'Final year', 'Postgraduate', 'Working']
    },
    email: { type: String, required: true },
    whatsapp: { type: String, required: true },
    promathsMember: { 
        type: String, 
        required: true,
        enum: ['Promaths Member', 'Promaths Alumni', 'Not yet - interested']
    },
    skillLevel: { 
        type: String, 
        required: true,
        enum: [
            'Never coded before', 
            'Have basic coding skills (C++, Python, JS, Java, HTML etc)', 
            'I have built small projects before', 
            'Dont have any idea what coding even is'
        ]
    },
    attendOnlineSessions: { 
        type: String, 
        required: true,
        enum: ['No - data problems', 'Yes', 'No - other reasons']
    },
    device: { 
        type: String, 
        required: true,
        enum: ['Phone', 'Tablet', 'Laptop']
    },
    reliableInternet: { type: String, required: true, enum: ['Yes', 'No'] },
    consent: { type: String, required: true, enum: ['Yes', 'No'] },
    registrationDate: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Routes (unchanged)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// POST endpoint to save form data
app.post('/api/register', async (req, res) => {
    try {
        const studentData = req.body;
        const student = new Student(studentData);
        await student.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Registration successful!',
            data: student 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Registration failed',
            error: error.message 
        });
    }
});

// GET endpoint to retrieve all form data
app.get('/api/registrations', async (req, res) => {
    try {
        const students = await Student.find().sort({ registrationDate: -1 });
        res.json({ 
            success: true, 
            data: students 
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch registrations',
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});