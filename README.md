# Forge_CS307_Project
A workout and diet tracking app that integrates AI to help give personalized advice and keep them on their fitness goals. CS 307 Group Project


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
