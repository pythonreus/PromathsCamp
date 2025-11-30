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

// Student Schema
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


// User Schema for Firebase authentication
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String },
    photoURL: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Resource Schema
const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Resource = mongoose.model('Resource', resourceSchema);

// Lesson Schema
const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    projectTitle: { type: String, required: true },
    projectInstructions: { type: String, required: true },
    dueDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model('Lesson', lessonSchema);

// Submission Schema
const submissionSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    projectLink: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'submitted', enum: ['submitted', 'reviewed', 'approved', 'rejected'] }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Student Registration Endpoints
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

// Resource Endpoints
app.post('/api/resources', async (req, res) => {
    try {
        const { title, description, link } = req.body;
        
        if (!title || !description || !link) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and link are required'
            });
        }

        const resource = new Resource({
            title,
            description,
            link
        });

        await resource.save();

        res.status(201).json({
            success: true,
            message: 'Resource added successfully',
            data: resource
        });
    } catch (error) {
        console.error('Resource creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create resource',
            error: error.message
        });
    }
});

app.get('/api/resources', async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resources',
            error: error.message
        });
    }
});

app.delete('/api/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const resource = await Resource.findByIdAndDelete(id);
        
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        console.error('Resource deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete resource',
            error: error.message
        });
    }
});

// Lesson Endpoints
app.post('/api/lessons', async (req, res) => {
    try {
        const { title, content, projectTitle, projectInstructions, dueDate } = req.body;
        
        if (!title || !content || !projectTitle || !projectInstructions) {
            return res.status(400).json({
                success: false,
                message: 'Title, content, project title, and project instructions are required'
            });
        }

        const lesson = new Lesson({
            title,
            content,
            projectTitle,
            projectInstructions,
            dueDate: dueDate || null
        });

        await lesson.save();

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: lesson
        });
    } catch (error) {
        console.error('Lesson creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create lesson',
            error: error.message
        });
    }
});

app.get('/api/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: lessons
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lessons',
            error: error.message
        });
    }
});

app.put('/api/lessons/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        
        const lesson = await Lesson.findById(id);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        lesson.isActive = !lesson.isActive;
        await lesson.save();

        res.json({
            success: true,
            message: `Lesson ${lesson.isActive ? 'activated' : 'deactivated'} successfully`,
            data: lesson
        });
    } catch (error) {
        console.error('Lesson toggle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle lesson status',
            error: error.message
        });
    }
});

app.delete('/api/lessons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete the lesson and all associated submissions
        const [lesson] = await Promise.all([
            Lesson.findByIdAndDelete(id),
            Submission.deleteMany({ lessonId: id })
        ]);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            message: 'Lesson and associated submissions deleted successfully'
        });
    } catch (error) {
        console.error('Lesson deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete lesson',
            error: error.message
        });
    }
});

// Submission Endpoints
app.post('/api/submissions', async (req, res) => {
    try {
        const { studentName, studentEmail, lessonId, projectLink } = req.body;
        
        if (!studentName || !studentEmail || !lessonId || !projectLink) {
            return res.status(400).json({
                success: false,
                message: 'Student name, email, lesson ID, and project link are required'
            });
        }

        // Check if lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const submission = new Submission({
            studentName,
            studentEmail,
            lessonId,
            projectLink
        });

        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Project submitted successfully',
            data: submission
        });
    } catch (error) {
        console.error('Submission creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit project',
            error: error.message
        });
    }
});

app.get('/api/submissions', async (req, res) => {
    try {
        const { lessonId } = req.query;
        
        let query = {};
        if (lessonId) {
            query.lessonId = lessonId;
        }

        const submissions = await Submission.find(query)
            .populate('lessonId', 'title')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch submissions',
            error: error.message
        });
    }
});

app.put('/api/submissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['submitted', 'reviewed', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: submitted, reviewed, approved, rejected'
            });
        }

        const submission = await Submission.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('lessonId', 'title');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.json({
            success: true,
            message: 'Submission status updated successfully',
            data: submission
        });
    } catch (error) {
        console.error('Submission status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update submission status',
            error: error.message
        });
    }
});

app.delete('/api/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const submission = await Submission.findByIdAndDelete(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.json({
            success: true,
            message: 'Submission deleted successfully'
        });
    } catch (error) {
        console.error('Submission deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete submission',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});


// Firebase Auth verification endpoint
app.post('/api/auth/verify', async (req, res) => {
    try {
        const { firebaseUid, email, displayName, photoURL } = req.body;
        
        if (!firebaseUid || !email) {
            return res.status(400).json({
                success: false,
                message: 'Firebase UID and email are required'
            });
        }

        // Check if user already exists in our database
        let user = await User.findOne({ firebaseUid: firebaseUid });
        
        if (!user) {
            // Create new user in database with only Firebase data
            user = new User({
                firebaseUid: firebaseUid,
                email: email,
                displayName: displayName || '',
                photoURL: photoURL || ''
            });

            await user.save();
            
            res.json({
                success: true,
                message: 'New user created and logged in',
                data: user,
                isNewUser: true
            });
        } else {
            // User exists, just return success
            res.json({
                success: true,
                message: 'User logged in successfully',
                data: user,
                isNewUser: false
            });
        }
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});