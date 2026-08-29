# Forge_CS307_Project
A workout and diet tracking app that integrates AI to help give personalized advice and keep users on their fitness goals. CS 307 Group Project


```
branch architecture
-> app
  -> fast_api
    -> api.py      # server side work (host session, process requests)
  -> core
    -> db.py       # database schema (Profile(PK: ID - INTEGER NOT NULL, ...))
    -> repos.py    # database side work (write queries)
-> react_frontend
  -> main.jsx      # client side work (colors & buttons, create requests)
  -> api.jsx       # connects client to server (send requests)
  ```

## Features
- Workout and diet tracking
- AI-generated workout plans based on muscle group, user goals, and personal progress
- AI-generated diet plans based on caloric and macro goals

## Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** FastAPI (Python)
- **Database:** SQLLite
- **AI/ML:** OpenAI API

## Team

- [Your name(s) and roles — CS 307 grading usually wants this, tied to Agile/Scrum roles like Scrum Master, PO, dev team]

## Getting Started

### Prerequisites
- Node.js and Expo CLI
- Python 3.x
- PostgreSQL

### Installation

\`\`\`bash
# Clone the repo
git clone <repo-url>
cd forge

# Backend setup
cd backend
# configure your .env (DB connection, API keys)
uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npx expo start
\`\`\`

## Project Status

Complete — all core features implemented as of [May/Sprint 3].

