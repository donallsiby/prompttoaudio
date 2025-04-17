Below is a detailed report for the **SoundScape** project, structured as a formal project documentation. This report includes an overview, technologies and languages used, requirements, architecture, implementation details, testing, limitations, and future recommendations. It is tailored to your request to run the project locally on your system, based on the provided `app.py` and `App.tsx` code.

---

# SoundScape Project Report

## 1. Project Overview
### 1.1 Project Title
**SoundScape: AI-Powered Audio Generation Application**

### 1.2 Purpose
SoundScape is a web-based application designed to generate audio files from text prompts using artificial intelligence models. It allows users to create music, sound effects, or text-to-speech audio, view their generation history, and play or download the resulting files. The project is developed for local use on a personal system, with audio files stored on the filesystem and prompt history managed in a PostgreSQL database.

### 1.3 Objectives
- Enable users to generate audio from text prompts using multiple AI models.
- Provide a user-friendly interface for login, registration, and history management.
- Store and retrieve audio files and prompts reliably on a local system.
- Support predefined prompts (e.g., rain, ocean, forest sounds) for quick access.
- Offer playback and download functionality for generated audio.

### 1.4 Target Audience
- Individuals interested in audio generation for personal projects (e.g., music enthusiasts, content creators).
- Developers experimenting with AI audio models locally.
- Users who prefer offline or local application usage.

---

## 2. Technologies and Languages Used
### 2.1 Programming Languages
- **Python**: Used for the backend implementation with Flask.
- **TypeScript**: Used for the frontend implementation with React.
- **SQL**: Used for database queries in PostgreSQL.

### 2.2 Frameworks and Libraries
#### Backend
- **Flask**: A lightweight Python web framework for building the REST API.
- **Flask-CORS**: Enables cross-origin resource sharing for frontend-backend communication.
- **Transformers**: Provides the MusicGen model from Hugging Face for music generation.
- **Audiocraft**: Provides the AudioGen model for sound effect generation.
- **gTTS**: Google Text-to-Speech library for text-to-audio conversion.
- **NumPy and SoundFile**: Handle audio data processing and file writing.
- **Psycopg2**: PostgreSQL adapter for Python to manage database operations.
- **Bcrypt**: Password hashing for user security.
- **Torch**: Deep learning framework for GPU support (optional, based on device availability).

#### Frontend
- **React**: A JavaScript library for building the user interface.
- **Vite**: A build tool and development server for fast React development.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Lucide React**: Icon library for UI elements.
- **React-Use-Audio-Player**: Library for audio playback in the browser.

### 2.3 Database
- **PostgreSQL**: Relational database for storing user data and prompt history.

### 2.4 Development Tools
- **Node.js**: Runtime environment for the frontend.
- **npm**: Package manager for frontend dependencies.
- **pip**: Package manager for backend dependencies.
- **Git** (optional): Version control system.

---

## 3. Requirements
### 3.1 System Requirements
- **Operating System**: Windows, macOS, or Linux (tested on Windows based on file paths).
- **Processor**: Multi-core CPU (GPU optional for faster model loading).
- **Memory**: Minimum 8GB RAM (16GB recommended for AI model processing).
- **Storage**: At least 10GB free space for audio files, models, and project files.
- **Internet**: Required initially for model downloads and predefined prompt URLs.

### 3.2 Software Requirements
- **Python 3.9+**: For backend execution.
- **Node.js 18+**: For frontend development.
- **PostgreSQL 12+**: For database management.
- **Git** (optional): For version control.

### 3.3 Dependency Requirements
#### Backend (`requirements.txt`)
```
flask==2.3.2
flask-cors==4.0.0
requests==2.31.0
transformers==4.35.0
audiocraft==1.0.0
gtts==2.5.0
numpy==1.26.0
soundfile==0.12.1
psycopg2-binary==2.9.6
bcrypt==4.0.1
torch==2.0.1
```
#### Frontend (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-use-audio-player": "^1.2.0",
    "lucide-react": "^0.263.0",
    "tailwindcss": "^3.3.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```

### 3.4 Hardware Recommendations
- **GPU**: NVIDIA GPU with CUDA support for faster AI model processing (optional).
- **SSD**: For faster file I/O operations with audio files.

---

## 4. Project Architecture
### 4.1 Architecture Overview
The project follows a **client-server architecture** with a separation of concerns:
- **Frontend**: React-based UI for user interaction, running on `http://localhost:5173`.
- **Backend**: Flask-based API for audio generation and data management, running on `http://localhost:5000`.
- **Database**: PostgreSQL for persistent storage of users and prompts.

### 4.2 Data Flow
1. **User Authentication**:
   - Frontend sends login/register requests to `/login` or `/register`.
   - Backend validates credentials, stores users in PostgreSQL, and returns a `userId`.
2. **Sound Generation**:
   - Frontend sends a prompt to `/generate-sound` with `userId`, `prompt`, and `model`.
   - Backend generates audio using the selected model, saves it to `generated_audio/`, and stores the prompt in the database.
   - Backend returns the `audio_file_path` (e.g., `http://localhost:5000/generated_audio/output_musicgen_20250331_120000.wav`).
3. **History Management**:
   - Frontend fetches history from `/history/<user_id>`.
   - Users can regenerate or delete entries via backend APIs.
4. **Audio Playback/Download**:
   - Frontend requests audio from `/generated_audio/<filename>` and plays or downloads it.

### 4.3 File Structure
```
project/
├── backend/
│   ├── app.py                  # Flask backend code
│   ├── backend.log             # Log file for backend activities
│   ├── generated_audio/        # Directory for storing generated audio files
│   │   ├── output_musicgen_20250331_120000.wav
│   │   └── ...
│   ├── audiogen-medium/        # Local AudioGen model files
│   └── requirements.txt        # Python dependencies
├── src/
│   ├── components/
│   │   ├── Login.tsx           # Login component
│   │   ├── Register.tsx        # Register component
│   │   └── MainPage.tsx        # Landing page component
│   ├── App.tsx                 # Main React component
│   ├── index.css               # Global styles (Tailwind CSS)
│   └── main.tsx                # Entry point for React
├── public/                     # Static assets (e.g., favicon)
├── package.json                # Node.js dependencies and scripts
├── vite.config.ts              # Vite configuration
└── tailwind.config.js          # Tailwind CSS configuration
```

---

## 5. Implementation Details
### 5.1 Backend (`app.py`)
- **API Endpoints**:
  - `/`: Health check.
  - `/register`: POST to create a new user.
  - `/login`: POST to authenticate a user.
  - `/generate-sound`: POST to generate audio and store in history.
  - `/history/<user_id>`: GET to retrieve prompt history.
  - `/history/<user_id>/<prompt_id>`: DELETE to remove a history entry.
  - `/generated_audio/<filename>`: GET to serve audio files.
- **Models**:
  - MusicGen: 10-second music clips.
  - AudioGen: 6-second sound effects.
  - gTTS: Variable-duration text-to-speech.
- **Storage**: Audio files in `generated_audio/`, prompts in PostgreSQL.
- **Caching**: In-memory cache to avoid redundant generation.

### 5.2 Frontend (`App.tsx`)
- **Components**:
  - `Login`: Handles user login with email and password.
  - `Register`: Handles user registration.
  - `MainPage`: Displays predefined prompts.
- **Features**:
  - Theme toggle (dark/light) persisted in `localStorage`.
  - Collapsible sidebar for history.
  - Playback and download buttons for audio.
  - Loading state with cancellation support.
- **State Management**: Uses React hooks (`useState`, `useEffect`, `useRef`).

### 5.3 Database Schema
- **users**:
  - `id` (SERIAL), `email` (VARCHAR), `password` (VARCHAR).
- **prompts**:
  - `id` (SERIAL), `user_id` (INTEGER), `prompt` (TEXT), `audio_file_path` (TEXT), `model` (VARCHAR), `timestamp` (TIMESTAMP).

---

## 6. Testing
### 6.1 Test Cases
1. **User Authentication**:
   - Register a new user (success/failure with duplicate email).
   - Log in with valid/invalid credentials.
   - Logout and verify session reset.
2. **Sound Generation**:
   - Generate audio with MusicGen, AudioGen, and gTTS.
   - Use predefined prompts (rain, ocean, forest).
   - Cancel generation and verify state reset.
3. **History Management**:
   - Generate multiple prompts and verify history display.
   - Regenerate a prompt and check new entry.
   - Delete a history entry and confirm removal.
4. **Audio Playback/Download**:
   - Play audio from latest and history sections.
   - Download audio and verify file integrity.
5. **Edge Cases**:
   - Empty prompt (error message).
   - Long prompt (backend handling).
   - Network disconnection during generation.

### 6.2 Testing Environment
- Local system with Windows (based on file paths).
- PostgreSQL running on `localhost:5432`.
- Backend on `http://localhost:5000`, frontend on `http://localhost:5173`.

---

## 7. Limitations
1. **Local Storage**: Audio files in `generated_audio/` may consume disk space over time.
2. **No Cleanup**: No mechanism to remove old or unused audio files.
3. **Single User**: Designed for local use, not optimized for multiple users.
4. **Model Loading**: Slow startup due to large AI model loading (especially without GPU).

---

## 8. Future Recommendations
1. **Storage Management**:
   - Implement a script to delete audio files older than 30 days or not in the `prompts` table.
2. **Performance Optimization**:
   - Debounce `handlePrompt` to prevent rapid API calls.
   - Preload models or use lighter versions for faster startup.
3. **Feature Enhancements**:
   - Add a settings page for model/duration preferences.
   - Enable history export/import as JSON.
   - Include audio waveform visualization.
4. **Security**:
   - Restrict `/generated_audio/<filename>` with authentication for production.
   - Use HTTP-only cookies instead of `localStorage` for `userId`.
5. **Deployment Preparation**:
   - Move audio storage to AWS S3.
   - Deploy backend to a cloud service (e.g., AWS EC2).
   - Host frontend on a static service (e.g., Netlify).

---

## 9. Conclusion
The SoundScape project successfully delivers a local audio generation application with user authentication, multiple AI models, and history management. It leverages Python and React with robust dependencies, ensuring a functional and user-friendly experience. While designed for local use, it provides a solid foundation for future enhancements and potential deployment. The project meets its objectives of generating and storing audio with prompts, with opportunities for optimization and feature expansion based on user needs.

---

## 10. Appendix
### 10.1 Full Code
- **Backend**: See `app.py` provided earlier.
- **Frontend**: See `App.tsx` provided earlier.

### 10.2 Setup Instructions
1. Install Python, Node.js, and PostgreSQL.
2. Set up the database with the provided schema.
3. Install backend dependencies with `pip install -r requirements.txt`.
4. Install frontend dependencies with `npm install`.
5. Run the backend with `python app.py`.
6. Run the frontend with `npm run dev`.
7. Access the app at `http://localhost:5173`.

### 10.3 Contact
- **Developer**: [Your Name]
- **Date**: April 03, 2025

---

This report provides a comprehensive view of the SoundScape project, suitable for documentation or presentation purposes. If you need further details or adjustments, let me know!