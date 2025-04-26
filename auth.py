from datetime import datetime, timezone, timedelta
import jwt
from functools import lru_cache
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class MyConfig(BaseSettings):
    connection_string: str = (
        "mongodb+srv://mitchellrgage:PASSWORD@cluster0.4fzlw.mongodb.net/?retryWrites=true&w=majority"
    )        #Edit the username, password, and cluster name^
    secret_key: str = "PASSWORD"

    model_config = SettingsConfigDict(env_file="../.env")


@lru_cache
def get_settings():
    return MyConfig()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str
    exp_datetime: datetime


ALGORITHM = "HS256"


def create_access_token(data: dict):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload.update({"exp": expire})
    key = get_settings().secret_key
    encoded = jwt.encode(payload, key, algorithm=ALGORITHM)
    return encoded


def decode_jwt_token(token: str) -> TokenData | None:
    try:
        key = get_settings().secret_key
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        print(payload)
        username: str = payload.get("username")
        exp: int = payload.get("exp")
        return TokenData(username=username, exp_datetime=datetime.fromtimestamp(exp))
    except jwt.InvalidTokenError:
        print("Incorrect username/password")
