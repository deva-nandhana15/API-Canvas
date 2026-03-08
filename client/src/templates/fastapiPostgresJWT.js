// ============================================================
// fastapiPostgresJWT.js — FastAPI + PostgreSQL + JWT Template
// ============================================================
// Generates a production-ready FastAPI endpoint with SQLAlchemy
// (PostgreSQL) integration and optional JWT auth via HTTPBearer.
// Used by the Code Generator page.
// ============================================================

export function generateFastapiPostgresJWT({
  method,
  path,
  bodyFields,
  authRequired,
}) {
  // Parse comma-separated body fields into an array
  const fields = bodyFields
    ? bodyFields
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  // Derive model name from the first path segment
  const modelName = path.split("/").filter(Boolean)[0] || "Item";
  const ModelName =
    modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return `from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
${
  authRequired
    ? "from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials"
    : ""
}
import os

app = FastAPI()

DATABASE_URL = os.environ.get(
  'DATABASE_URL', 
  'postgresql://user:password@localhost/${modelName}db'
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(
  autocommit=False, 
  autoflush=False, 
  bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
${
  fields.length > 0
    ? `
class ${ModelName}Schema(BaseModel):
${fields.map((f) => `    ${f}: str`).join("\n")}
`
    : ""
}
@app.${method.toLowerCase()}('${path}')
async def handle_endpoint(${
    fields.length > 0 ? `data: ${ModelName}Schema, ` : ""
  }db: Session = Depends(get_db)${
    authRequired
      ? ", credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())"
      : ""
  }):
    try:
        ${
          fields.map((f) => `${f} = data.${f}`).join("\n        ") ||
          "# No request body needed"
        }

        # TODO: Add your PostgreSQL logic here
        # Example: result = db.query(YourModel)
        #   .filter(YourModel.id == id).first()

        return {
            'success': True,
            'message': '${method} ${path} successful'
        }

    except Exception as e:
        raise HTTPException(
          status_code=500, 
          detail=str(e)
        )`;
}
