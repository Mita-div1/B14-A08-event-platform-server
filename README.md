# EventHub Server

REST API for the EventHub Social Development Events Platform, built with Express.js and MongoDB.

**Live API:** https://b14-a08-event-platform-server.onrender.com

## Endpoints

- `GET /events` - upcoming events (supports `?limit=6`)
- `GET /events/:id` - single event
- `POST /events` - create an event
- `PUT /events/:id` - update your own event
- `DELETE /events/:id` - delete your own event
- `POST /join` - join an event
- `GET /joined` - events joined by a user
- `GET /my-events` - events created by a user

## Setup

bash 


npm install
npm start


Copy `.env.example` to `.env` and add your MongoDB connection string.