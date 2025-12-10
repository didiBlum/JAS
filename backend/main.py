from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import GenerateAnswerRequest, GenerateAnswerResponse, ParsedCV
from cv_parser import parse_cv_file
from answer_generator import generate_answer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SubmitMe API", version="1.0.0")

# CORS - allow extension to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "submitme-api"}


@app.post("/upload_cv", response_model=ParsedCV)
async def upload_cv(file: UploadFile = File(...)):
    """
    Upload and parse a CV file (PDF or DOCX).
    Returns structured CV data.
    """
    try:
        logger.info(f"Received CV upload: {file.filename}")

        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.docx')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only PDF and DOCX are supported."
            )

        # Read file content
        content = await file.read()

        # Parse CV
        parsed_cv = await parse_cv_file(content, file.filename)

        logger.info(f"Successfully parsed CV for: {parsed_cv.name}")
        return parsed_cv

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error parsing CV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse CV")


@app.post("/generate_answer", response_model=GenerateAnswerResponse)
async def generate_answer_endpoint(request: GenerateAnswerRequest):
    """
    Generate a tailored answer to an application question.
    Uses the candidate's CV data and style preferences.
    """
    try:
        logger.info(f"Generating answer for question: {request.question[:50]}...")

        response = await generate_answer(
            question=request.question,
            cv_data=request.cv_data,
            style=request.style,
            job_description=request.job_description
        )

        logger.info(f"Generated {response.question_type} answer")
        return response

    except Exception as e:
        logger.error(f"Error generating answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate answer")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
