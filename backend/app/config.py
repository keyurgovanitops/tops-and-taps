import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./homeserve.db")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_homeserve_2026_vibecoding_jwt_token_auth")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_us_TX9wuOHHTItsL8")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "dzwsbmb6")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "513286465541511")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

os.makedirs(UPLOAD_DIR, exist_ok=True)

