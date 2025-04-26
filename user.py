from beanie import Document
from fastapi import HTTPException, status
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from auth import Token, create_access_token, decode_jwt_token, TokenData


class User(Document):
    username: str
    password: str
    email: str
    role: str = "user"

    class Settings:
        name = "users"


class UserRequest(BaseModel):
    username: str
    password: str
    email: str


class UserDto(BaseModel):
    id: str
    username: str


from typing import Annotated

pwd_context = CryptContext(schemes=["bcrypt"])


class HashPassword:
    def create_hash(self, password: str):
        return pwd_context.hash(password)

    def verify_hash(self, input_password: str, hashed_password: str):
        return pwd_context.verify(input_password, hashed_password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/sign-in")
hash_password = HashPassword()


def get_user(token: Annotated[str, Depends(oauth2_scheme)]) -> TokenData:
    print(token)
    return decode_jwt_token(token)


user_router = APIRouter()


@user_router.post("/signup")
async def sign_up(user: UserRequest):
    existing_user = await User.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists.")
    hashed_pwd = hash_password.create_hash(user.password)
    new_user = User(username=user.username, password=hashed_pwd, email=user.email)
    await new_user.create()
    return {"message": "User created successfully."}


@user_router.post("/sign-in")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    username = form_data.username
    # Use the dict-based filter
    existing_user = await User.find_one({"username": username})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    authenticated = hash_password.verify_hash(
        form_data.password, existing_user.password
    )
    if authenticated:
        access_token = create_access_token(
            {"username": username, "role": existing_user.role}
        )
        return Token(access_token=access_token)

    raise HTTPException(status_code=401, detail="Invalid username or password")


@user_router.get("")
async def get_all_users(user: Annotated[TokenData, Depends(get_user)]) -> list[UserDto]:
    users = await User.find_all().to_list()
    result = []
    for u in users:
        result.append(UserDto(id=str(u.id), username=u.username))
    return result
