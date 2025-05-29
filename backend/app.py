from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import logging
import base64
import re
import traceback
from models import db, User, TranslationHistory
from auth import generate_token, token_required
import requests
import easyocr
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados
current_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(current_dir, 'app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'chave-secreta-desenvolvimento'  # Em produção, use uma chave segura

# Inicialização do EasyOCR com configurações otimizadas para CPU
reader = easyocr.Reader(
    ['en', 'pt'],  # suporte para inglês e português
    gpu=False,     # forçar uso da CPU
    model_storage_directory='./models',  # diretório para salvar os modelos
    download_enabled=True,  # permitir download automático dos modelos
    recog_network='latin_g2'  # modelo mais leve para reconhecimento
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

logger.debug(f"Caminho do banco de dados: {db_path}")

# Inicialização do banco de dados
db.init_app(app)

# Criar todas as tabelas
with app.app_context():
    db.create_all()
    logger.info("Banco de dados inicializado e tabelas criadas")

@app.route('/api/register', methods=['POST'])
def register():
    try:
        logger.debug("Iniciando processo de registro...")
        data = request.get_json()
        if not data:
            logger.error("Dados de registro não fornecidos ou inválidos")
            return jsonify({'message': 'Dados de registro inválidos'}), 400
            
        logger.debug(f"Tentativa de registro: {data.get('email', 'email não fornecido')}")
        
        # Verificar campos obrigatórios
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                logger.error(f"Campo obrigatório ausente: {field}")
                return jsonify({'message': f'Campo obrigatório ausente: {field}'}), 400
        
        # Verificar se o email já existe
        if User.query.filter_by(email=data['email']).first():
            logger.debug(f"Email já cadastrado: {data.get('email')}")
            return jsonify({'message': 'Email já cadastrado'}), 400
        
        try:
            # Criar novo usuário
            logger.debug("Criando novo usuário...")
            logger.debug(f"Nome: {data['name']}, Email: {data['email']}, Senha: {'*' * len(data['password'])}")
            
            user = User(
                name=data['name'],
                email=data['email'],
                avatar_url=None
            )
            
            logger.debug("Definindo senha...")
            user.set_password(data['password'])
            
            # Salvar no banco de dados
            logger.debug("Adicionando usuário ao banco de dados...")
            db.session.add(user)
            db.session.commit()
            logger.debug(f"Usuário criado com sucesso: {user.id}, {user.name}, {user.email}")
            
            # Gerar token JWT
            logger.debug("Gerando token JWT...")
            token = generate_token(user)
            logger.debug("Token JWT gerado com sucesso.")
            
            result = {
                'message': 'Usuário registrado com sucesso',
                'token': token[:10] + '...',  # Truncar para log
                'user': user.to_dict()
            }
            logger.debug(f"Resultado do registro: {result}")
            
            return jsonify({
                'message': 'Usuário registrado com sucesso',
                'token': token,
                'user': user.to_dict()
            }), 201
            
        except Exception as inner_error:
            db.session.rollback()
            logger.error(f"Erro ao criar usuário: {str(inner_error)}")
            logger.error(traceback.format_exc())
            return jsonify({'message': f'Erro ao criar usuário: {str(inner_error)}'}), 500
        
    except Exception as e:
        logger.error(f'Erro no registro: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'message': f'Erro ao registrar usuário: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Email ou senha inválidos'}), 401
            
        token = generate_token(user)
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f'Erro no login: {str(e)}')
        return jsonify({'message': 'Erro ao fazer login'}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        return jsonify({
            'user': current_user.to_dict()
        })
    except Exception as e:
        logger.error(f'Erro ao buscar perfil: {str(e)}')
        return jsonify({'message': 'Erro ao buscar perfil'}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        if 'name' in data:
            current_user.name = data['name']
        if 'email' in data:
            current_user.email = data['email']
        if 'preferred_language' in data:
            current_user.preferred_language = data['preferred_language']
        if 'theme' in data:
            current_user.theme = data['theme']
        if 'notifications' in data:
            current_user.notifications = data['notifications']
        if 'auto_detect_language' in data:
            current_user.auto_detect_language = data['auto_detect_language']
        if 'avatar_url' in data:
            current_user.avatar_url = data['avatar_url']
            
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': current_user.to_dict()
        })
        
    except Exception as e:
        logger.error(f'Erro ao atualizar perfil: {str(e)}')
        return jsonify({'message': 'Erro ao atualizar perfil'}), 500

@app.route('/api/translate', methods=['POST'])
@token_required
def translate(current_user):
    try:
        data = request.get_json()
        
        payload = {
            'q': data['text'],
            'source': data.get('source', 'auto'),
            'target': data.get('target', current_user.preferred_language),
            'format': 'text'
        }
        
        # Conectar ao servidor LibreTranslate
        response = requests.post('http://localhost:5002/translate', json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Verificar a estrutura do resultado
        if 'translatedText' not in result:
            logger.error(f'Resposta inesperada do LibreTranslate: {result}')
            return jsonify({'message': 'Resposta inesperada do serviço de tradução'}), 500
        
        # Obter o idioma detectado
        detected_language = 'unknown'
        if 'detectedLanguage' in result:
            detected_language = result['detectedLanguage'].get('language', 'unknown')
        elif 'source' in payload and payload['source'] != 'auto':
            detected_language = payload['source']
        
        # Salvar a tradução no histórico
        translation = TranslationHistory(
            user_id=current_user.id,
            source_text=data['text'],
            translated_text=result['translatedText'],
            source_language=detected_language,
            target_language=payload['target']
        )
        
        db.session.add(translation)
        db.session.commit()
        
        return jsonify({
            'translated_text': result['translatedText'],
            'detected_language': detected_language
        })
        
    except requests.exceptions.RequestException as e:
        logger.error(f'Erro na tradução: {str(e)}')
        return jsonify({'message': 'Erro ao traduzir texto. Verifique se o servidor LibreTranslate está em execução na porta 5002.'}), 500
    except Exception as e:
        logger.error(f'Erro inesperado: {str(e)}')
        return jsonify({'message': 'Erro inesperado'}), 500

@app.route('/api/detect', methods=['POST'])
@token_required
def detect_language(current_user):
    try:
        data = request.get_json()
        
        payload = {
            'q': data['text']
        }
        
        # Conectar ao servidor LibreTranslate
        response = requests.post('http://localhost:5002/detect', json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Verificar se o resultado está no formato esperado
        if not result or not isinstance(result, list) or len(result) == 0:
            logger.error(f'Resposta inesperada do LibreTranslate: {result}')
            return jsonify({'message': 'Resposta inesperada do serviço de detecção'}), 500
        
        # Obter o primeiro resultado (maior confiança)
        first_result = result[0]
        
        return jsonify({
            'detected_language': first_result.get('language', 'unknown'),
            'confidence': first_result.get('confidence', 0)
        })
        
    except requests.exceptions.RequestException as e:
        logger.error(f'Erro na detecção de idioma: {str(e)}')
        return jsonify({'message': 'Erro ao detectar idioma. Verifique se o servidor LibreTranslate está em execução na porta 5002.'}), 500
    except Exception as e:
        logger.error(f'Erro inesperado: {str(e)}')
        return jsonify({'message': 'Erro inesperado'}), 500

@app.route('/api/translations', methods=['GET'])
@token_required
def get_translation_history(current_user):
    try:
        translations = TranslationHistory.query.filter_by(user_id=current_user.id).order_by(TranslationHistory.created_at.desc()).all()
        return jsonify({
            'translations': [translation.to_dict() for translation in translations]
        })
    except Exception as e:
        logger.error(f'Erro ao buscar histórico de traduções: {str(e)}')
        return jsonify({'message': 'Erro ao buscar histórico de traduções'}), 500

@app.route('/api/translations/<int:translation_id>', methods=['DELETE'])
@token_required
def delete_translation(current_user, translation_id):
    try:
        translation = TranslationHistory.query.filter_by(id=translation_id, user_id=current_user.id).first()
        
        if not translation:
            return jsonify({'message': 'Tradução não encontrada'}), 404
            
        db.session.delete(translation)
        db.session.commit()
        
        return jsonify({'message': 'Tradução removida com sucesso'})
    except Exception as e:
        logger.error(f'Erro ao remover tradução: {str(e)}')
        return jsonify({'message': 'Erro ao remover tradução'}), 500

@app.route('/api/translations', methods=['DELETE'])
@token_required
def clear_translation_history(current_user):
    try:
        translations = TranslationHistory.query.filter_by(user_id=current_user.id).all()
        
        for translation in translations:
            db.session.delete(translation)
            
        db.session.commit()
        
        return jsonify({'message': 'Histórico de traduções limpo com sucesso'})
    except Exception as e:
        logger.error(f'Erro ao limpar histórico de traduções: {str(e)}')
        return jsonify({'message': 'Erro ao limpar histórico de traduções'}), 500

@app.route('/api/profile/avatar', methods=['POST'])
@token_required
def update_avatar(current_user):
    try:
        data = request.get_json()
        if 'avatar' not in data:
            return jsonify({'message': 'Avatar não fornecido'}), 400
            
        # Processar string base64
        avatar_data = data['avatar']
        # Remover prefixo como "data:image/jpeg;base64,"
        if ',' in avatar_data:
            avatar_data = avatar_data.split(',')[1]
        
        # Validar que é uma string base64 válida
        try:
            decoded_data = base64.b64decode(avatar_data)
            # Verificar tamanho (2MB max)
            if len(decoded_data) > 2 * 1024 * 1024:  # 2MB em bytes
                return jsonify({'message': 'Imagem muito grande. Máximo 2MB'}), 400
        except Exception as e:
            logger.error(f'Erro ao decodificar avatar: {str(e)}')
            return jsonify({'message': 'Formato de imagem inválido'}), 400
            
        current_user.avatar_url = data['avatar']
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar atualizado com sucesso',
            'user': current_user.to_dict()
        })
        
    except Exception as e:
        logger.error(f'Erro ao atualizar avatar: {str(e)}')
        return jsonify({'message': 'Erro ao atualizar avatar'}), 500

@app.route('/api/translate-image', methods=['POST'])
@token_required
def translate_image(current_user):
    try:
        if 'image' not in request.files:
            return jsonify({'message': 'Nenhuma imagem enviada'}), 400

        image_file = request.files['image']
        image = Image.open(image_file.stream).convert("RGB")
        image_np = np.array(image)

        # Extrair texto com EasyOCR
        result = reader.readtext(image_np)
        extracted_text = ' '.join([text_info[1] for text_info in result])

        return jsonify({
            'original_text': extracted_text
        })

    except Exception as e:
        logger.error(f'Erro ao processar imagem: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'message': 'Erro ao processar imagem'}), 500

if __name__ == '__main__':
    app.run(debug=True)