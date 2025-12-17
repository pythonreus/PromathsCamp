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


// Project Submission Schema
const projectSubmissionSchema = new mongoose.Schema({
    studentName: { 
        type: String, 
        required: true,
        trim: true 
    },
    studentEmail: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true
    },
    projectTitle: {
        type: String,
        required: true,
        trim: true
    },
    githubRepo: { 
        type: String, 
        required: true,
        trim: true
    },
    hostedSite: { 
        type: String, 
        required: true,
        trim: true
    },
    status: { 
        type: String, 
        default: 'submitted', 
        enum: ['submitted', 'in review', 'approved', 'rejected', 'needs improvement']
    },
    reviewMessage: {
        type: String,
        trim: true,
        default: null
    },
    submittedAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create compound index to prevent duplicates
projectSubmissionSchema.index({ studentEmail: 1, projectTitle: 1 }, { unique: true });

// Update timestamp on save
projectSubmissionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ProjectSubmission = mongoose.model('ProjectSubmission', projectSubmissionSchema);


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

// Survey Schema
const surveySchema = new mongoose.Schema({
    studentEmail: { 
        type: String, 
        required: true,
        index: true
    },
    studentName: { 
        type: String, 
        required: true 
    },
    learnedAnything: { 
        type: String, 
        required: true,
        enum: ['Yes', 'No']
    },
    resultsObserved: { 
        type: String, 
        required: true,
        enum: ['Big results', 'Small results', 'No results']
    },
    continueNextYear: { 
        type: String, 
        required: true,
        enum: ['Yes', 'No']
    },
    challengesFaced: { 
        type: String, 
        required: true,
        maxlength: 1000
    },
    improvementsSuggested: { 
        type: String, 
        required: true,
        maxlength: 1000
    },
    helpNeeded: { 
        type: String, 
        required: true,
        maxlength: 1000
    },
    exercisesHelpfulness: { 
        type: String, 
        required: true,
        enum: ['Very helpful', 'To some extent', 'Not really']
    },
    experienceRating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 10
    },
    additionalComments: { 
        type: String, 
        maxlength: 1500
    },
    submissionDate: { 
        type: Date, 
        default: Date.now 
    }
});

// Create index for efficient queries
surveySchema.index({ studentEmail: 1, submissionDate: -1 });

const Survey = mongoose.model('Survey', surveySchema);
// Survey Endpoints
app.post('/api/surveys', async (req, res) => {
    try {
        console.log('Survey submission received:', req.body.studentEmail);
        
        const {
            studentEmail,
            studentName,
            learnedAnything,
            resultsObserved,
            continueNextYear,
            challengesFaced,
            improvementsSuggested,
            helpNeeded,
            exercisesHelpfulness,
            experienceRating,
            additionalComments
        } = req.body;

        // Validate required fields
        const requiredFields = {
            studentEmail,
            studentName,
            learnedAnything,
            resultsObserved,
            continueNextYear,
            challengesFaced,
            improvementsSuggested,
            helpNeeded,
            exercisesHelpfulness,
            experienceRating
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return res.status(400).json({
                    success: false,
                    message: `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`
                });
            }
        }

        // Check if student already submitted a survey
        const existingSurvey = await Survey.findOne({ studentEmail: studentEmail.trim() });
        if (existingSurvey) {
            return res.status(409).json({
                success: false,
                message: 'You have already submitted a survey'
            });
        }

        // Validate experience rating
        const rating = parseInt(experienceRating);
        if (isNaN(rating) || rating < 1 || rating > 10) {
            return res.status(400).json({
                success: false,
                message: 'Experience rating must be a number between 1 and 10'
            });
        }

        // Create new survey
        const survey = new Survey({
            studentEmail: studentEmail.trim(),
            studentName: studentName.trim(),
            learnedAnything,
            resultsObserved,
            continueNextYear,
            challengesFaced: challengesFaced.trim(),
            improvementsSuggested: improvementsSuggested.trim(),
            helpNeeded: helpNeeded.trim(),
            exercisesHelpfulness,
            experienceRating: rating,
            additionalComments: additionalComments ? additionalComments.trim() : ''
        });

        await survey.save();
        console.log('Survey saved successfully for:', studentEmail);

        res.status(201).json({
            success: true,
            message: 'Survey submitted successfully',
            data: survey
        });

    } catch (error) {
        console.error('Survey submission error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already submitted a survey'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit survey',
            error: error.message
        });
    }
});

app.get('/api/surveys', async (req, res) => {
    try {
        const { 
            studentEmail, 
            startDate, 
            endDate,
            sortBy = 'submissionDate',
            sortOrder = 'desc'
        } = req.query;

        let query = {};
        
        // Filter by student email if provided
        if (studentEmail) {
            query.studentEmail = studentEmail;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.submissionDate = {};
            if (startDate) {
                query.submissionDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.submissionDate.$lte = new Date(endDate);
            }
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const surveys = await Survey.find(query)
            .sort(sortOptions)
            .limit(100); // Limit to prevent overload

        res.json({
            success: true,
            count: surveys.length,
            data: surveys
        });

    } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch surveys',
            error: error.message
        });
    }
});

app.get('/api/surveys/summary', async (req, res) => {
    try {
        // Get survey statistics
        const totalSurveys = await Survey.countDocuments();

        if (totalSurveys === 0) {
            return res.json({
                success: true,
                message: 'No surveys submitted yet',
                data: {
                    totalSurveys: 0,
                    statistics: {}
                }
            });
        }

        // Get aggregated statistics
        const stats = {
            learnedAnything: await Survey.aggregate([
                { $group: { _id: "$learnedAnything", count: { $sum: 1 } } }
            ]),
            resultsObserved: await Survey.aggregate([
                { $group: { _id: "$resultsObserved", count: { $sum: 1 } } }
            ]),
            continueNextYear: await Survey.aggregate([
                { $group: { _id: "$continueNextYear", count: { $sum: 1 } } }
            ]),
            exercisesHelpfulness: await Survey.aggregate([
                { $group: { _id: "$exercisesHelpfulness", count: { $sum: 1 } } }
            ]),
            averageRating: await Survey.aggregate([
                { $group: { _id: null, average: { $avg: "$experienceRating" } } }
            ]),
            ratingDistribution: await Survey.aggregate([
                { $group: { _id: "$experienceRating", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            latestSurveys: await Survey.find()
                .sort({ submissionDate: -1 })
                .limit(5)
                .select('studentName studentEmail experienceRating submissionDate')
        };

        // Format the response
        const formattedStats = {
            totalSurveys,
            learnedAnything: stats.learnedAnything.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            resultsObserved: stats.resultsObserved.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            continueNextYear: stats.continueNextYear.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            exercisesHelpfulness: stats.exercisesHelpfulness.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            averageRating: stats.averageRating[0]?.average ? parseFloat(stats.averageRating[0].average.toFixed(2)) : 0,
            ratingDistribution: stats.ratingDistribution.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            latestSurveys: stats.latestSurveys
        };

        res.json({
            success: true,
            data: formattedStats
        });

    } catch (error) {
        console.error('Error fetching survey summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch survey summary',
            error: error.message
        });
    }
});

app.get('/api/surveys/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const survey = await Survey.findById(id);
        
        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Survey not found'
            });
        }

        res.json({
            success: true,
            data: survey
        });

    } catch (error) {
        console.error('Error fetching survey:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch survey',
            error: error.message
        });
    }
});

app.delete('/api/surveys/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const survey = await Survey.findByIdAndDelete(id);
        
        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Survey not found'
            });
        }

        res.json({
            success: true,
            message: 'Survey deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting survey:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete survey',
            error: error.message
        });
    }
});

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

        // Check if submission already exists for this student+lesson
        let submission = await Submission.findOne({
            studentEmail,
            lessonId
        });

        if (submission) {
            // Update existing submission
            submission.projectLink = projectLink;
            submission.studentName = studentName; // in case they change name spelling
            await submission.save();

            return res.status(200).json({
                success: true,
                message: 'Submission updated successfully',
                data: submission
            });
        }

        // Create new submission
        submission = new Submission({
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
        console.error('Submission creation/update error:', error);
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


// =================== USER PROJECT SUBMISSION ENDPOINTS ===================

// 1. Get user's submission (or return empty template)
app.get('/api/user/project-submission/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // Find existing submission for this user
        const submission = await ProjectSubmission.findOne({ 
            studentEmail: email.toLowerCase() 
        });

        // If submission exists, return it
        if (submission) {
            return res.json({
                success: true,
                data: submission,
                hasSubmission: true
            });
        }

        // If no submission exists, return empty template
        res.json({
            success: true,
            data: {
                studentName: '',
                studentEmail: email,
                projectTitle: '',
                githubRepo: '',
                hostedSite: '',
                status: 'not submitted'
            },
            hasSubmission: false
        });

    } catch (error) {
        console.error('Error fetching user submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project submission',
            error: error.message
        });
    }
});

// 2. Create or update submission (handles both without duplication)
app.post('/api/user/project-submission', async (req, res) => {
    try {
        const {
            studentName,
            studentEmail,
            projectTitle,
            githubRepo,
            hostedSite
        } = req.body;

        // Validate required fields
        if (!studentName || !studentEmail || !projectTitle || !githubRepo || !hostedSite) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Normalize email
        const normalizedEmail = studentEmail.trim().toLowerCase();
        
        // Check if submission already exists for this user
        const existingSubmission = await ProjectSubmission.findOne({
            studentEmail: normalizedEmail,
            projectTitle: projectTitle.trim()
        });

        let submission;
        let isNew = false;

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.studentName = studentName.trim();
            existingSubmission.githubRepo = githubRepo.trim();
            existingSubmission.hostedSite = hostedSite.trim();
            existingSubmission.status = 'submitted'; // Reset status when updating
            
            // Clear review message when user resubmits
            existingSubmission.reviewMessage = null;
            
            submission = await existingSubmission.save();
        } else {
            // Create new submission
            submission = new ProjectSubmission({
                studentName: studentName.trim(),
                studentEmail: normalizedEmail,
                projectTitle: projectTitle.trim(),
                githubRepo: githubRepo.trim(),
                hostedSite: hostedSite.trim()
            });
            
            submission = await submission.save();
            isNew = true;
        }

        res.json({
            success: true,
            message: isNew ? 'Project submitted successfully!' : 'Project updated successfully!',
            data: submission,
            isNew: isNew
        });

    } catch (error) {
        console.error('Project submission error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'A project with this title already exists for your account'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit project',
            error: error.message
        });
    }
});

// 3. Update submission (explicit update endpoint)
app.put('/api/user/project-submission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { studentName, projectTitle, githubRepo, hostedSite } = req.body;

        // Validate required fields
        if (!studentName || !projectTitle || !githubRepo || !hostedSite) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const submission = await ProjectSubmission.findById(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Project submission not found'
            });
        }

        // Check if trying to change to a title that already exists for this user
        if (projectTitle.trim() !== submission.projectTitle) {
            const existingWithTitle = await ProjectSubmission.findOne({
                studentEmail: submission.studentEmail,
                projectTitle: projectTitle.trim(),
                _id: { $ne: id } // Exclude current submission
            });

            if (existingWithTitle) {
                return res.status(409).json({
                    success: false,
                    message: 'You already have a project with this title'
                });
            }
        }

        // Update submission
        submission.studentName = studentName.trim();
        submission.projectTitle = projectTitle.trim();
        submission.githubRepo = githubRepo.trim();
        submission.hostedSite = hostedSite.trim();
        submission.status = 'submitted'; // Reset status
        submission.reviewMessage = null; // Clear review when user updates

        const updatedSubmission = await submission.save();

        res.json({
            success: true,
            message: 'Project updated successfully!',
            data: updatedSubmission
        });

    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update project',
            error: error.message
        });
    }
});



// =================== ADMIN PROJECT SUBMISSION ENDPOINTS ===================

// 1. Get all submissions (no filtering)
app.get('/api/admin/project-submissions', async (req, res) => {
    try {
        const submissions = await ProjectSubmission.find()
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            count: submissions.length,
            data: submissions
        });

    } catch (error) {
        console.error('Error fetching all project submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project submissions',
            error: error.message
        });
    }
});

// 2. Update submission status and review message
app.put('/api/admin/project-submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewMessage } = req.body;
        
        // Validate status
        const validStatuses = ['submitted', 'in review', 'approved', 'rejected', 'needs improvement'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Find and update submission
        const submission = await ProjectSubmission.findById(id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Project submission not found'
            });
        }

        // Update fields if provided
        if (status) submission.status = status;
        if (reviewMessage !== undefined) {
            // Allow empty string to clear the review message
            submission.reviewMessage = reviewMessage ? reviewMessage.trim() : null;
        }

        const updatedSubmission = await submission.save();

        res.json({
            success: true,
            message: 'Submission updated successfully',
            data: updatedSubmission
        });

    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update submission',
            error: error.message
        });
    }
});


// Cleanup: Keep only latest submission per student per lesson
async function cleanupSubmissions() {
    try {
        // Get all submissions sorted newest → oldest
        const submissions = await Submission.find().sort({ createdAt: -1 });

        const seen = new Set(); 
        const toDelete = [];

        for (const sub of submissions) {
            const key = `${sub.studentEmail}-${sub.lessonId}`;

            if (seen.has(key)) {
                // Already saw a newer submission → delete this one
                toDelete.push(sub._id);
            } else {
                // First time seeing this pair → keep it
                seen.add(key);
            }
        }

        if (toDelete.length > 0) {
            await Submission.deleteMany({ _id: { $in: toDelete } });
        }

        console.log(`Cleanup complete. Deleted ${toDelete.length} old submissions.`);
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}

cleanupSubmissions();



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});