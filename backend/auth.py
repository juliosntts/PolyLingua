import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from models import User

def generate_token(user):
    """
    Gera um token JWT para o usuário
    """
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user.id
    }
    return jwt.encode(
        payload,
        'chave-secreta-desenvolvimento',  # Em produção, use uma chave segura
        algorithm='HS256'
    )

def token_required(f):
    """
    Decorator para verificar se o token é válido
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Verifica se o token foi fornecido no cabeçalho
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token não fornecido'}), 401

        try:
            # Decodifica o token
            payload = jwt.decode(token, 'chave-secreta-desenvolvimento', algorithms=['HS256'])
            current_user = User.query.filter_by(id=payload['sub']).first()

            if not current_user:
                return jsonify({'message': 'Usuário não encontrado'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        # Passa o usuário atual para a função decorada
        return f(current_user, *args, **kwargs)

    return decorated 