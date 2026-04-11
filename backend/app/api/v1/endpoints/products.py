import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_seller
from app.db.CRUD.products import create_product, get_all_products_with_prices, get_product_by_id_with_prices, get_products, update_product
from app.db.CRUD.products_with_default_prices import get_products_with_default_prices
from app.schemas.product import ProductCreate, ProductRead, ProductReadWithPrices, ProductUpdate
from app.schemas.product_with_default_price import ProductWithDefaultPriceBase
from app.models.user import User

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "uploads", "products")

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return get_products(db)

#return all products with default price
@router.get("/with_default_prices", response_model=list[ProductWithDefaultPriceBase])
def list_products_with_default_prices(db: Session = Depends(get_db)):
    return get_products_with_default_prices(db)


@router.post("/", response_model=ProductRead)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    return create_product(db, product)


@router.patch("/{product_id}", response_model=ProductRead)
def patch_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_seller: User = Depends(get_current_seller),
):
    product = update_product(db, product_id, product_update)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/with_prices", response_model=list[ProductReadWithPrices])
def list_products_with_prices(db: Session = Depends(get_db)):
    return get_all_products_with_prices(db)


@router.get(
    "/{product_id}/with_prices",
    response_model=ProductReadWithPrices,
    responses={404: {"description": "Product not found"}},
)
def get_product_with_prices(product_id: int, db: Session = Depends(get_db)):
    product = get_product_by_id_with_prices(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...),
    current_seller: User = Depends(get_current_seller),
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya formatı. İzin verilen: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate file size (read into memory)
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Dosya boyutu 5 MB'dan büyük olamaz.")

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(contents)

    # Return the URL path that will be served by StaticFiles
    image_url = f"/uploads/products/{unique_name}"
    return {"imageurl": image_url}


