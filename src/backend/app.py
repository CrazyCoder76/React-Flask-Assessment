from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from packaging import version
import uuid
import whisper
from cryptography.fernet import Fernet
from concurrent.futures import ThreadPoolExecutor

import os

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

ENCRYPTION_KEY = Fernet.generate_key()
fernet = Fernet(ENCRYPTION_KEY)

model = whisper.load_model("base")

executor = ThreadPoolExecutor(max_workers=5)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    motto = db.Column(db.String(4096))

class TranscriptionTask(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    result = db.Column(db.Text, nullable=True)

def encrypt_motto(motto):
    return fernet.encrypt(motto.encode())

def decrypt_motto(encrypted_motto):
    return fernet.decrypt(encrypted_motto).decode()

def mock_transcription_service(audio_file_path):
    result = model.transcribe(audio_file_path)
    return result

def process_transcription(task_id, audio_file_path):
    try:
        transcript = mock_transcription_service(audio_file_path)
        
        with app.app_context():
            task = TranscriptionTask.query.get(task_id)
            if task:
                task.status = 'completed'
                task.result = transcript
                
                user = User.query.get(task.user_id)
                if user:
                    user.encrypted_motto = encrypt_motto(transcript)
                
                db.session.commit()
        
        os.remove(audio_file_path)
    except Exception as e:
        with app.app_context():
            task = TranscriptionTask.query.get(task_id)
            if task:
                task.status = 'failed'
                db.session.commit()
        print(f"Error in transcription process: {str(e)}")

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SECRET_KEY'] = 'secret123'
    app.config['JWT_SECRET_KEY'] = 'secret1234'

    CORS(
        app,
        resources={r"*": {"origins": ["*"]}},
        allow_headers=["Authorization", "Content-Type", "App-Version"],
        methods=["GET", "POST", "OPTIONS"],
        max_age=86400,
        supports_credentials=True
    )

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        db.create_all()

    # @app.before_request
    # def check_version():
    #     client_version = request.headers.get('app-version')

    #     if not client_version or version.parse(client_version) < version.parse('1.2.0'):
    #         return jsonify({'message': 'Please update your client application'}), 426

    @app.route('/')
    def index():
        return jsonify({'status': 200})

    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        new_user = User(username=data['username'], password=hashed_password, motto='')
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201

    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if user and bcrypt.check_password_hash(user.password, data['password']):
            access_token = create_access_token(identity={'username': user.username})
            return jsonify({'token': access_token}), 200
        return jsonify({'message': 'Invalid credentials'}), 401

    @app.route('/user', methods=['GET'])
    @jwt_required()
    def user():
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user['username']).first()
        return jsonify({
            'id': user.id,
            'username': user.username,
            'motto': user.motto
        }), 200
    
    @app.route('/upload', methods=['POST'])
    @jwt_required()
    def upload_audio():
        if 'audio' not in request.files or 'userId' not in request.form:
            return jsonify({'error': 'No audio file or user ID provided'}), 400

        audio_file = request.files['audio']
        user_id = request.form['userId']

        if audio_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if audio_file:
            filename = f'upload/audio_{uuid.uuid4()}.webm'
            audio_file.save(filename)

            task_id = str(uuid.uuid4())
            new_task = TranscriptionTask(id=task_id, user_id=user_id, status='in_progress')
            db.session.add(new_task)
            db.session.commit()

            executor.submit(process_transcription, task_id, filename)

            return jsonify({'message': 'Audio uploaded and transcription started', 'taskId': task_id}), 202
    
    @app.route('/transcription_status/<task_id>', methods=['GET'])
    def get_transcription_status(task_id):
        task = TranscriptionTask.query.get(task_id)
        if task:
            return jsonify({'status': task.status}), 200
        return jsonify({'error': 'Task not found'}), 404

    return app



if __name__ == '__main__':
    app = create_app()
    app.run(port=5000, debug=True)
