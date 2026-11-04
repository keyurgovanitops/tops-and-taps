import os
import uuid
import logging
import cloudinary
import cloudinary.uploader
from backend.app.config import (
    UPLOAD_DIR,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
)

logger = logging.getLogger(__name__)

# Configure Cloudinary
if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY:
    try:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
        logger.info(f"Cloudinary initialized for cloud: {CLOUDINARY_CLOUD_NAME}")
    except Exception as e:
        logger.warning(f"Could not initialize Cloudinary: {e}")


def upload_media_file(file_bytes: bytes, filename: str, folder: str = "homeserve") -> str:
    """
    Uploads file to Cloudinary if secret is available, or saves locally to UPLOAD_DIR as fallback.
    Returns the public image URL.
    """
    # 1. Try Cloudinary if API secret is configured
    if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        try:
            upload_result = cloudinary.uploader.upload(
                file_bytes,
                folder=f"topstaps/{folder}",
                resource_type="auto",
            )
            secure_url = upload_result.get("secure_url")
            if secure_url:
                logger.info(f"Uploaded to Cloudinary: {secure_url}")
                return secure_url
        except Exception as err:
            logger.warning(f"Cloudinary upload failed ({err}). Falling back to local storage.")

    # 2. Local File System Fallback
    safe_filename = f"{folder}_{uuid.uuid4().hex[:8]}_{filename}"
    local_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    return f"/uploads/{safe_filename}"
