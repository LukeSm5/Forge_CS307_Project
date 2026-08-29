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

- Luke Smith - Developer
- Drew Balaji - Developer / SCRUM Master
- Roan Finkle - Developer
- Artem Yurovskiy - Developer
- Jack Smith - Developer
- Pratik Bang - Developer

## Getting Started

### Installation

# Clone the repo
git clone https://github.com/LukeSm5/Forge_CS307_Project.git

cd Forge_CS307_Project

# Backend setup
In a terminal:

uvicorn app.fast_api.api:app --reload

# Frontend setup
In a different terminal:

cd ../frontend

npm install

npx expo start

## Project Status

Complete — all core features implemented as of [May/Sprint 3].

