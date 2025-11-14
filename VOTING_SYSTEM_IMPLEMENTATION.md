# Voting System Implementation Guide

## ✅ Implementation Complete

A complete upvote/downvote system has been implemented for both questions and answers in GyanSetu.

---

## 📋 What Was Implemented

### 1. Database Schema (`backend/scripts/13-add-voting-system.sql`)

- **`question_votes` table**: Stores votes on questions
- **`answer_votes` table**: Stores votes on answers
- Both tables include:
  - `vote` field: `1` for upvote, `-1` for downvote
  - Unique constraint on `(question_id/answer_id, user_id)` to prevent duplicate votes
  - RLS policies for secure voting
  - Indexes for performance

### 2. Server Actions (`frontend/app/question/[id]/voting-actions.ts`)

- `voteQuestion()`: Handles voting on questions
- `voteAnswer()`: Handles voting on answers with role-based validation
- `getUserQuestionVote()`: Gets user's vote on a question
- `getUserAnswerVote()`: Gets user's vote on an answer
- Automatic karma updates: +2 for upvote, -2 for downvote

### 3. UI Components

- **`QuestionVoting`** (`frontend/components/question/question-voting.tsx`):
  - Upvote/downvote buttons for questions
  - Shows vote score
  - Highlights user's current vote

- **`AnswerVoting`** (`frontend/components/question/answer-voting.tsx`):
  - Upvote/downvote buttons for answers
  - Shows vote score
  - Highlights user's current vote

### 4. Integration

- Updated `frontend/app/question/[id]/page.tsx`:
  - Calculates question vote scores
  - Fetches user votes
  - Displays `QuestionVoting` component

- Updated `frontend/components/question/answer-list.tsx`:
  - Replaced old upvote button with `AnswerVoting` component
  - Removed old `handleUpvote` function
  - Integrated vote scores and user votes

---

## 🔐 Role-Based Voting Rules

### Students
- ✅ Can upvote/downvote **student answers**
- ❌ Cannot vote on **admin/superadmin answers**
- ❌ Cannot vote on **own questions/answers**

### Admins / SuperAdmins
- ✅ Can vote on **ANY student answer**
- ❌ Cannot vote on **other admin/superadmin answers**
- ❌ Cannot vote on **own questions/answers**

### Everyone
- ✅ Can vote on **any question** (except their own)
- ❌ Cannot vote on **own content**

---

## 💰 Karma Points System

- **Upvote**: +2 karma points
- **Downvote**: -2 karma points
- **Vote removed**: Karma adjusted accordingly
- **Vote changed**: Karma adjusted based on the difference

Karma changes are logged in the `karma_log` table.

---

## 🎨 UI Features

- **Visual feedback**: 
  - Upvoted items show blue highlight
  - Downvoted items show red highlight
  - Vote count displayed with color coding (green for positive, red for negative)

- **Disabled states**: 
  - Voting buttons are disabled when:
    - User is the author
    - Role-based rules prevent voting
    - Action is pending

- **Real-time updates**: 
  - Vote counts update immediately
  - UI refreshes after voting
  - Toast notifications for feedback

---

## 📝 Setup Instructions

### 1. Run Database Migration

Execute the SQL migration in Supabase:

```sql
-- Run: backend/scripts/13-add-voting-system.sql
```

This will:
- Create `question_votes` and `answer_votes` tables
- Set up RLS policies
- Create helper functions for vote score calculation

### 2. Verify Tables

Check that the following tables exist:
- `question_votes`
- `answer_votes`

### 3. Test Voting

1. **As a Student**:
   - Try voting on a student's answer ✅
   - Try voting on an admin's answer ❌ (should be disabled)
   - Try voting on your own answer ❌ (should be disabled)

2. **As an Admin/SuperAdmin**:
   - Try voting on a student's answer ✅
   - Try voting on another admin's answer ❌ (should be disabled)
   - Try voting on your own answer ❌ (should be disabled)

3. **Vote Score**:
   - Upvote should increase score by 1
   - Downvote should decrease score by 1
   - Clicking same vote again should remove it

4. **Karma Points**:
   - Check that karma increases/decreases correctly
   - Verify karma_log entries are created

---

## 🔍 Technical Details

### Vote Calculation

Vote scores are calculated by summing all votes:
```sql
SELECT SUM(vote) FROM question_votes WHERE question_id = ?
```

### Vote State Management

- Each user can have one vote per question/answer
- Voting again with the same value removes the vote
- Voting with a different value changes the vote

### Performance

- Indexes on `question_id`, `answer_id`, and `user_id` for fast queries
- Batch fetching of votes for all answers on a question page
- Efficient vote score calculation using aggregation

---

## 🐛 Troubleshooting

### Issue: Votes not saving
- **Check**: RLS policies are enabled
- **Check**: User is authenticated
- **Check**: Database migration was run

### Issue: Karma not updating
- **Check**: `karma_log` table exists
- **Check**: Server actions are executing successfully
- **Check**: Console for error messages

### Issue: Voting buttons disabled incorrectly
- **Check**: User role in `profiles` table
- **Check**: Answer/question author ID
- **Check**: Role-based validation logic

---

## 📊 Database Schema

```sql
question_votes:
  - id (UUID, PK)
  - question_id (UUID, FK → questions)
  - user_id (UUID, FK → profiles)
  - vote (INTEGER: 1 or -1)
  - created_at (TIMESTAMP)
  - UNIQUE(question_id, user_id)

answer_votes:
  - id (UUID, PK)
  - answer_id (UUID, FK → answers)
  - user_id (UUID, FK → profiles)
  - vote (INTEGER: 1 or -1)
  - created_at (TIMESTAMP)
  - UNIQUE(answer_id, user_id)
```

---

## ✅ Checklist

- [x] Database tables created
- [x] RLS policies configured
- [x] Server actions implemented
- [x] UI components created
- [x] Role-based validation
- [x] Karma system integration
- [x] Real-time UI updates
- [x] Error handling
- [x] Toast notifications
- [x] Disabled states for invalid votes

---

## 🎯 Next Steps (Optional Enhancements)

1. **Vote History**: Show who voted on what
2. **Vote Analytics**: Track voting patterns
3. **Vote Notifications**: Notify users when their content is voted on
4. **Vote Sorting**: Sort answers by vote score
5. **Vote Trends**: Show vote trends over time

---

**Implementation Date**: Current
**Status**: ✅ Complete and Ready for Testing

