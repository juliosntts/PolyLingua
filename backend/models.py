from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import logging

db = SQLAlchemy()
logger = logging.getLogger(__name__)

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    preferred_language = db.Column(db.String(10), default='pt')
    theme = db.Column(db.String(10), default='light')
    notifications = db.Column(db.Boolean, default=True)
    auto_detect_language = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    translations = db.relationship('TranslationHistory', backref='user', lazy=True)

    def set_password(self, password):
        try:
            if not password:
                logger.error("Tentativa de definir senha vazia")
                raise ValueError("A senha não pode ser vazia")
                
            if len(password) < 6:
                logger.warning("Tentativa de definir senha muito curta")
                
            self.password_hash = generate_password_hash(password)
            logger.debug(f"Senha definida com sucesso para usuário {self.email}")
        except Exception as e:
            logger.error(f"Erro ao definir senha: {str(e)}")
            raise

    def check_password(self, password):
        try:
            if not password:
                logger.error("Tentativa de verificar senha vazia")
                return False
                
            result = check_password_hash(self.password_hash, password)
            if not result:
                logger.warning(f"Tentativa de login malsucedida para usuário {self.email}")
            return result
        except Exception as e:
            logger.error(f"Erro ao verificar senha: {str(e)}")
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'preferred_language': self.preferred_language,
            'theme': self.theme,
            'notifications': self.notifications,
            'auto_detect_language': self.auto_detect_language,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class TranslationHistory(db.Model):
    __tablename__ = 'translation_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    source_text = db.Column(db.Text, nullable=False)
    translated_text = db.Column(db.Text, nullable=False)
    source_language = db.Column(db.String(10), nullable=False)
    target_language = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'source_text': self.source_text,
            'translated_text': self.translated_text,
            'source_language': self.source_language,
            'target_language': self.target_language,
            'created_at': self.created_at.isoformat()
        } 