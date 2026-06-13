from models.schemas import ResumeData


def score_resume(resume: ResumeData, job_description: str) -> dict:
    raise NotImplementedError
