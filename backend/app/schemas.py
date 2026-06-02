from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    stock: int = 0

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v < 0:
            raise ValueError("price must be positive")
        return v

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("stock cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("price must be positive")
        return v

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("stock cannot be negative")
        return v


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    stock: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    product_id: int
    qty: int

    @field_validator("qty")
    @classmethod
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be at least 1")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    qty: int
    price: float
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]


class OrderOut(BaseModel):
    id: int
    customer_id: int
    total: float
    status: str
    created_at: datetime
    customer: Optional[CustomerOut] = None
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}
