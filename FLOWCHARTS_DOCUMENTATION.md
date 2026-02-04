# System Flowcharts Documentation

This document describes the flowcharts that represent the tourism recommendation system's processes.

## Overview

The system consists of two main processes:
1. **Embedding Generation Flow** - Converting user-uploaded images into embedding vectors
2. **Recommendation System Flow** - Using embeddings to generate personalized destination recommendations

## Files

- `flowcharts.mermaid` - Embedding generation flowchart
- `recommendation-flowchart.mermaid` - Recommendation system flowchart  
- `complete-system-flowchart.mermaid` - Combined end-to-end system flow

## Process 1: User Registration & Preference Collection Flow

### Description
This flowchart shows the complete onboarding process for new users, from registration to preference collection and learning.

### Steps

1. **User Registration** - User registers with email and password (first time)
2. **Form Display** - System shows preference form containing:
   - **Questions**: Textual questions for the user to answer
   - **Image Multi-Select**: Images for the user to select as favorable
3. **Form Submission** - User submits the completed form
4. **Input Processing** - System processes both types of inputs:
   - **Textual Processing**: Processes answers to questions
   - **Visual Processing**: Processes selected images
5. **Image Processing** (for selected images):
   - **Preprocessing**: Resize and normalize selected images
   - **Feature Extraction**: Use CNN or CLIP model to extract features
   - **Generate Embedding**: Create 512-dimensional embedding vectors
6. **Profile Building** - Combine textual answers and visual embeddings
7. **Learn Preferences** - System learns user preferences from combined data
8. **Save Preferences** - Store learned preferences in UserPreference table

### API Endpoints
- `POST /auth/register` - User registration
- `POST /preferences` - Submit preference form (questions + image selections)
- `PATCH /preferences/image` - Update image preferences (512-dim vector)

### Database
- **User** table stores user credentials
- **UserPreference** table stores the learned preference vector (512 dimensions)

## Process 2: Recommendation System Flow

### Description
This flowchart shows how the system generates personalized destination recommendations based on learned user preferences.

### Steps

1. **Check User Preferences** - System checks if user has existing preferences
   - If no: Show preference form (same as Process 1)
   - If yes: Proceed to matching engine
2. **Matching Engine** (within Matching Engine container):
   - **Get User Preference Vector**: Retrieve learned preference vector from database
   - **Query Destinations Database**: Get all destinations with embeddings
   - **Similarity Matching**: Calculate cosine similarity between user vector and destination vectors
   - **Rank Destinations**: Sort destinations by similarity score
3. **Results Check** - Check if results were found
   - If yes: Generate recommendations list
   - If no: Fallback to popular destinations
4. **Return Results** - Return JSON response with recommendations
5. **Display** - Display results to user

### Database Queries
- User preference vector from **UserPreference** table
- Destination embeddings from **Embedding** table (linked to **Place** and **Activity**)

### Similarity Calculation
- Uses **Cosine Similarity** to compare vectors
- Formula: `cos(θ) = (A · B) / (||A|| × ||B||)`

### Learning Mechanism
- System learns user preferences from:
  - **Textual answers** to form questions
  - **Visual selections** of favorable images (converted to embeddings)
- Both inputs are combined to build a comprehensive user preference profile

## Complete System Flow

The complete system flowchart combines both processes into an end-to-end flow showing:
1. **User Registration** - Email and password registration
2. **Preference Form** - Questions and image multi-select
3. **Input Processing** - Both textual and visual data processing
4. **Embedding Generation** - From selected images
5. **Preference Learning** - Combining textual and visual data
6. **User Preference Storage** - Saving learned preferences
7. **Recommendation Request** - User requests recommendations
8. **Similarity Matching** - Matching user preferences with destinations
9. **Results Generation** - Ranking and generating recommendations
10. **Display** - Showing results to user

## Technical Details

### Vector Dimensions
- All embedding vectors are **512 dimensions**
- Stored as PostgreSQL `vector` type (using pgvector extension)

### Models Used
- **CNN** (Convolutional Neural Network) - For image feature extraction
- **CLIP** (Contrastive Language-Image Pre-training) - Alternative model for feature extraction

### Database Schema
- **User**: Stores user credentials (email, password)
- **UserPreference**: Stores learned user preference vectors (512 dimensions)
- **Embedding**: Stores place and activity embeddings
- **Place**: Destination places
- **Activity**: Activities associated with places

### Preference Learning Process
1. **Textual Input**: User answers to form questions are processed
2. **Visual Input**: User-selected images are:
   - Preprocessed (resize, normalize)
   - Processed through CNN/CLIP for feature extraction
   - Converted to 512-dimensional embedding vectors
3. **Combination**: Both textual and visual data are combined to create a unified preference profile
4. **Learning**: System learns patterns from the combined data
5. **Storage**: Learned preferences stored as a 512-dimensional vector in UserPreference table

## Error Handling

The flowcharts include error handling for:
- Invalid image uploads
- Feature extraction failures
- Missing results (fallback to popular destinations)

## User Flow Summary

### First-Time User Journey
1. User registers with email and password
2. System displays preference form with:
   - Questions to answer (textual input)
   - Images to multi-select as favorable (visual input)
3. User submits form
4. System processes both inputs:
   - Processes textual answers
   - Processes selected images (generates embeddings)
5. System combines both data sources
6. System learns user preferences
7. Preferences saved to database
8. System can now generate personalized recommendations

### Returning User Journey
1. User logs in
2. System retrieves learned preferences
3. User requests recommendations
4. System matches preferences with destinations
5. System returns ranked recommendations

## Future Enhancements

Potential improvements:
1. Real-time image processing service integration
2. Batch processing for multiple images
3. Hybrid recommendation (content-based + collaborative filtering)
4. A/B testing for recommendation algorithms
5. User feedback loop to improve recommendations
6. Preference update mechanism (allow users to refine preferences)
7. Multi-modal learning improvements (better textual + visual combination)

