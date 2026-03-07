# AgriCredit

AI-powered financial forecasting and credit access tailored for the next generation of global agriculture.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (for Frontend)
- **Python**: v3.9+ (for Backend)
- **MongoDB**: Local instance or Atlas URI

---

### 🛠️ Backend Setup (FastAPI)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in your MongoDB URI.
   ```bash
   cp .env.example .env
   ```

5. **Run the server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   API will be available at: [http://localhost:8000](http://localhost:8000)
   Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🌐 Frontend Setup (Next.js)

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Ensure you have the required Clerk keys in your `.env.local` (if using Clerk).

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   App will be available at: [http://localhost:3000](http://localhost:3000)

---

### 📊 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Deck.gl, Clerk Auth
- **Backend**: FastAPI, MongoDB (Motor), Pydantic
- **ML**: Scikit-Learn, Pandas (ML Integration in progress)
