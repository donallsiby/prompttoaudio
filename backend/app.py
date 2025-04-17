import os
import logging
import warnings
import traceback
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from transformers import pipeline, AutoModelForTextToWaveform, AutoTokenizer
from audiocraft.models import AudioGen
from audiocraft.data.audio import audio_write
from gtts import gTTS
import numpy as np
import soundfile as sf
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import torch

# Suppress warnings
warnings.filterwarnings(
    "ignore",
    message="To copy construct from a tensor, it is recommended to use sourceTensor.clone().detach()"
)
warnings.filterwarnings(
    "ignore",
    message="torch.nn.utils.weight_norm is deprecated in favor of torch.nn.utils.parametrizations.weight_norm",
    category=UserWarning
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)

requests.packages.urllib3.disable_warnings()
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'

app = Flask(__name__)
CORS(app)

GENERATED_AUDIO_DIR = "generated_audio"
os.makedirs(GENERATED_AUDIO_DIR, exist_ok=True)

musicgen_generator = None
audiogen_generator = None
device = "cuda" if torch.cuda.is_available() else "cpu"
audio_cache = {}  # In-memory cache: {cache_key: audio_url}

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname="soundscape",
        user="postgres",
        password="admin123",
        host="localhost",
        port="5432"
    )
    return conn

def load_musicgen_model():
    global musicgen_generator
    try:
        logging.info(f"Loading MusicGen Medium model on {device}...")
        model = AutoModelForTextToWaveform.from_pretrained(
            "facebook/musicgen-medium",
            local_files_only=True
        ).to(device)
        tokenizer = AutoTokenizer.from_pretrained(
            "facebook/musicgen-medium",
            local_files_only=True
        )
        musicgen_generator = pipeline(
            "text-to-audio",
            model=model,
            tokenizer=tokenizer,
            device=0 if device == "cuda" else -1
        )
        logging.info("MusicGen Medium model loaded successfully.")
    except Exception as e:
        logging.error(f"Failed to load MusicGen Medium: {str(e)}")
        logging.error("Traceback:", exc_info=True)
        musicgen_generator = None

def load_audiogen_model():
    global audiogen_generator
    try:
        logging.info(f"Loading AudioGen Medium model on {device}...")
        model_name_or_path = "C:/Users/jerin/Downloads/project/backend/audiogen-medium"
        audiogen_generator = AudioGen.get_pretrained(model_name_or_path, device=device)
        logging.info("AudioGen Medium model loaded successfully.")
    except Exception as e:
        logging.error(f"Failed to load AudioGen Medium: {str(e)}")
        logging.error("Traceback:", exc_info=True)
        audiogen_generator = None

load_musicgen_model()
load_audiogen_model()

@app.route('/')
def index():
    return jsonify({"message": "Welcome to AI Sound Generator Backend!"})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id",
            (email, hashed_password.decode('utf-8'))
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'userId': user_id, 'message': 'Registration successful'}), 201
    except psycopg2.Error as e:
        if e.pgcode == '23505':
            return jsonify({'message': 'Email already exists'}), 400
        return jsonify({'message': 'Error registering user'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401

        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'userId': user['id'], 'message': 'Login successful'}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401
    except psycopg2.Error:
        return jsonify({'message': 'Error logging in'}), 500

@app.route('/generate-sound', methods=['POST'])
def generate_sound():
    try:
        data = request.get_json()
        if not data or 'prompt' not in data or 'userId' not in data:
            logging.warning("Invalid request: 'prompt' and 'userId' are required.")
            return jsonify({"error": "Prompt and userId are required"}), 400

        prompt = data['prompt'].lower().strip()
        model = data.get('model', 'musicgen')
        user_id = data['userId']
        audio_file_path = data.get('audioFilePath')  # For predefined prompts

        # If it's a predefined prompt, use the provided audio file path
        if model == 'predefined' and audio_file_path:
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO prompts (user_id, prompt, audio_file_path, model) VALUES (%s, %s, %s, %s) RETURNING id",
                    (user_id, prompt, audio_file_path, model)
                )
                prompt_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                conn.close()
                logging.info(f"Predefined prompt stored in database with ID {prompt_id}")
                return jsonify({"audioFilePath": audio_file_path, "promptId": prompt_id})
            except psycopg2.Error as e:
                logging.error(f"Error storing predefined prompt in database: {str(e)}")
                return jsonify({"error": "Failed to store predefined prompt in database"}), 500

        # Set duration based on the model (TTS will ignore duration)
        duration = 10 if model == 'musicgen' else 6 if model == 'audiogen' else None

        cache_duration = duration if duration is not None else "variable"
        cache_key = f"{prompt}_{cache_duration}_{model}"
        if cache_key in audio_cache:
            logging.info(f"Cache hit for prompt: {prompt}")
            audio_url = audio_cache[cache_key]
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO prompts (user_id, prompt, audio_file_path, model) VALUES (%s, %s, %s, %s) RETURNING id",
                    (user_id, prompt, audio_url, model)
                )
                prompt_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                conn.close()
                logging.info(f"Prompt stored in database with ID {prompt_id}")
            except psycopg2.Error as e:
                logging.error(f"Error storing prompt in database: {str(e)}")
                return jsonify({"error": "Failed to store prompt in database"}), 500
            return jsonify({"audioFilePath": audio_url, "promptId": prompt_id})

        logging.info(f"Received request: prompt='{prompt}', duration={duration if duration is not None else 'variable (TTS)'}, model='{model}', userId={user_id}")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"output_{model}_{timestamp}.wav"
        output_path = os.path.join(GENERATED_AUDIO_DIR, output_filename)
        output_path_without_ext = os.path.join(GENERATED_AUDIO_DIR, f"output_{model}_{timestamp}")

        # Generate the audio file
        if model == 'musicgen':
            if musicgen_generator is None:
                logging.warning("MusicGen Medium model is not loaded. Attempting to reload...")
                load_musicgen_model()
                if musicgen_generator is None:
                    logging.error("MusicGen Medium model failed to load after retry.")
                    return jsonify({"error": "MusicGen Medium model is not available"}), 500

            logging.info("Generating audio with MusicGen Medium...")
            sampling_rate = 32000
            tokens_per_second = 50
            max_new_tokens = int(duration * tokens_per_second)

            audio_data = musicgen_generator(
                prompt,
                generate_kwargs={"max_new_tokens": max_new_tokens}
            )
            audio = audio_data['audio']
            sample_rate = audio_data['sampling_rate']

            if audio.ndim == 3:
                audio = audio.squeeze()
            elif audio.ndim == 2:
                audio = audio.squeeze()

            audio = np.array(audio)
            sf.write(output_path, audio, sample_rate)
            logging.info(f"Audio generated and saved to {output_path}")

        elif model == 'audiogen':
            if audiogen_generator is None:
                logging.warning("AudioGen Medium model is not loaded. Attempting to reload...")
                load_audiogen_model()
                if audiogen_generator is None:
                    logging.error("AudioGen Medium model failed to load after retry.")
                    return jsonify({"error": "AudioGen Medium model is not available"}), 500

            logging.info("Generating audio with AudioGen Medium...")
            audiogen_generator.set_generation_params(duration=duration)
            wav = audiogen_generator.generate([prompt])

            for idx, one_wav in enumerate(wav):
                audio_write(
                    output_path_without_ext,
                    one_wav.cpu(),
                    audiogen_generator.sample_rate,
                    strategy="loudness",
                    loudness_compressor=True
                )
            output_path = f"{output_path_without_ext}.wav"
            logging.info(f"Audio generated and saved to {output_path}")

        elif model == 'text_to_speech':
            logging.info("Generating audio with gTTS...")
            tts = gTTS(text=prompt, lang='en')
            tts.save(output_path)
            logging.info(f"Audio generated and saved to {output_path}")

        else:
            logging.warning(f"Invalid model specified: {model}")
            return jsonify({"error": "Invalid model specified. Choose 'musicgen', 'audiogen', or 'text_to_speech'."}), 400

        # Verify the audio file exists before proceeding
        if not os.path.exists(output_path):
            logging.error(f"Audio file not found at {output_path}")
            return jsonify({"error": "Failed to generate audio file"}), 500

        # Store the prompt and audio file path in the database
        audio_url = f"http://localhost:5000/generated_audio/{output_filename}"
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO prompts (user_id, prompt, audio_file_path, model) VALUES (%s, %s, %s, %s) RETURNING id",
                (user_id, prompt, audio_url, model)
            )
            prompt_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            logging.info(f"Prompt and audio stored in database with ID {prompt_id}")
        except psycopg2.Error as e:
            logging.error(f"Error storing prompt in database: {str(e)}")
            return jsonify({"error": "Failed to store prompt in database"}), 500

        # Store in cache
        audio_cache[cache_key] = audio_url
        logging.info(f"Cached audio for prompt: {prompt}")

        logging.info(f"Returning audio URL: {audio_url}")
        return jsonify({"audioFilePath": audio_url, "promptId": prompt_id})

    except Exception as e:
        logging.error(f"Error generating sound: {str(e)}")
        logging.error("Traceback:", exc_info=True)
        return jsonify({"error": f"Failed to generate sound: {str(e)}"}), 500

@app.route('/generated_audio/<filename>')
def serve_audio(filename):
    try:
        file_path = os.path.join(GENERATED_AUDIO_DIR, filename)
        logging.info(f"Serving audio file: {file_path}")
        if os.path.exists(file_path):
            return send_from_directory(GENERATED_AUDIO_DIR, filename)
        else:
            logging.error(f"Audio file not found: {file_path}")
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        logging.error(f"Error serving audio file {filename}: {str(e)}")
        logging.error("Traceback:", exc_info=True)
        return jsonify({"error": "File not found"}), 404

@app.route('/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, prompt, audio_file_path, model, timestamp FROM prompts WHERE user_id = %s ORDER BY timestamp DESC",
            (user_id,)
        )
        history = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(history), 200
    except psycopg2.Error:
        return jsonify({'message': 'Error fetching history'}), 500

@app.route('/history/<int:user_id>/<int:prompt_id>', methods=['DELETE'])
def delete_history(user_id, prompt_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM prompts WHERE user_id = %s AND id = %s",
            (user_id, prompt_id)
        )
        if cur.rowcount == 0:
            return jsonify({'message': 'Prompt not found or not authorized'}), 404
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Prompt deleted successfully'}), 200
    except psycopg2.Error as e:
        logging.error(f"Error deleting prompt: {str(e)}")
        return jsonify({'message': 'Error deleting prompt'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)