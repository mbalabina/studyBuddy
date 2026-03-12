# Study Buddy App - TODO

## Database & Models
- [x] Create user table with email, password, telegram username
- [x] Create profile table (About Me: name, age, city, goal, level, subjects, schedule, bio, experience)
- [x] Create preferences table (Partner Preferences: age range, level, schedule, format, communication)
- [x] Create favorites table (user likes)
- [x] Database migration

## Authentication
- [x] Email/Password registration endpoint
- [x] Email/Password login endpoint
- [x] JWT token generation and verification
- [x] Protected procedure middleware

## Profile Management
- [x] Get user profile endpoint
- [x] Update About Me profile endpoint
- [x] Update Partner Preferences endpoint
- [x] Get profile completion status

## Matching System
- [x] Implement compatibility calculation algorithm
- [x] Get candidates with compatibility scores endpoint
- [x] Get specific candidate profile endpoint

## Discover & Browse
- [x] Like candidate endpoint
- [x] Unlike candidate endpoint
- [x] Get favorites list endpoint
- [x] Get admirers (who liked me) endpoint

## Frontend Integration
- [ ] Connect registration endpoint
- [ ] Connect login endpoint
- [ ] Connect profile update endpoints
- [ ] Connect matching/candidates endpoint
- [ ] Connect like/unlike endpoints
- [ ] Connect favorites list endpoint
- [ ] Connect admirers list endpoint

## Admin Panel
- [x] Get all users endpoint (admin only)
- [x] Get platform statistics endpoint (admin only)
- [x] Get user management endpoints (admin only)

## Testing & Deployment
- [ ] Write vitest tests for all endpoints
- [ ] Test authentication flow
- [ ] Test matching algorithm
- [ ] Test database operations
- [ ] Final deployment
