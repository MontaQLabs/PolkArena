# Quiz Feature Documentation

## Overview

The quiz feature allows users to create and host interactive quizzes in real-time rooms. Participants can join using a 6-digit PIN code, and the host can control the quiz flow.

## Features

### For Quiz Hosts
- Create quizzes with multiple choice and true/false questions
- Set time limits and points for each question
- Host live quiz rooms with unique 6-digit PINs
- Control quiz flow (start, next question, end)
- View real-time participant scores and rankings
- See final results and rankings

### For Participants
- Join quiz rooms using 6-digit PIN codes
- Answer questions in real-time with countdown timers
- View live leaderboard during the quiz
- See final results and rankings

## How to Use

### Creating a Quiz

1. Navigate to `/quiz` in the application
2. Click "Create Quiz" button
3. Enter quiz title and description
4. Click "Create Quiz" to save

### Adding Questions

1. After creating a quiz, click "Edit" on your quiz
2. Click "Add Question" button
3. Choose question type (Multiple Choice or True/False)
4. Enter question text and options
5. Set correct answer, points, and time limit
6. Click "Add Question" to save

### Hosting a Quiz Room

1. Go to your quiz and click "Host Room"
2. Enter a room name
3. Click "Create Room" to generate a unique PIN
4. Share the PIN with participants
5. Click "Start Quiz" when ready to begin
6. Use "Next Question" to advance through questions
7. Click "End Quiz" to finish and show results

### Joining a Quiz Room

1. Navigate to `/quiz`
2. Enter the 6-digit PIN in the "Join Quiz Room" section
3. Click "Join Room"
4. Wait for the host to start the quiz
5. Answer questions within the time limit
6. View your score and ranking

## Database Schema

The quiz feature uses the following database tables:

- `quizzes` - Stores quiz information
- `quiz_questions` - Stores individual questions
- `quiz_rooms` - Stores active quiz sessions
- `quiz_participants` - Stores room participants
- `quiz_answers` - Stores participant answers

## Technical Details

- Real-time updates using Supabase subscriptions
- Automatic PIN generation with uniqueness validation
- Timer-based question answering
- Score calculation and ranking
- Responsive design for mobile and desktop

## Security

- Users must be authenticated to create quizzes or join rooms
- Quiz hosts can only control their own quizzes
- PIN codes are unique and randomly generated
- Participant data is isolated per room

## File Structure

```
src/app/quiz/
├── page.tsx                    # Main quiz hub
├── [id]/
│   ├── edit/
│   │   └── page.tsx           # Quiz editor
│   └── host/
│       └── page.tsx           # Quiz hosting interface
└── room/
    └── [id]/
        └── page.tsx           # Quiz room interface

src/app/api/quiz/
└── generate-pin/
    └── route.ts               # PIN generation API

quiz-schema.sql                # Database schema
```

## Setup Instructions

1. Run the database schema: `quiz-schema.sql`
2. Update database types: `src/lib/database.types.ts`
3. The feature is now available at `/quiz`

## Future Enhancements

- Quiz templates and categories
- Image support for questions
- Advanced scoring algorithms
- Quiz analytics and reports
- Team-based quizzes
- Quiz sharing and public quizzes
