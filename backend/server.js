import express from 'express';
import cors from 'cors';
import torchaudio from 'torchaudio';
import { AudioGen } from 'audiocraft.models';
import { audio_write } from 'audiocraft.data.audio';
import AWS from 'aws-sdk'; // Import AWS SDK

// Load the pre-trained model
const model = AudioGen.get_pretrained('facebook/audiogen-medium');
model.set_generation_params(duration=5); // generate 5 seconds of audio

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Function to generate audio from a user prompt
const generateAudioFromPrompt = async (prompt, index) => {
    let wav;
    try {
        wav = await model.generate([prompt]);
    } catch (error) {
        console.error("Error generating audio:", error);
        throw new Error('Audio generation failed');
    }

    const audioBuffer = wav[0].cpu();
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `generated_audio/${index}.wav`,
        Body: audioBuffer,
        ContentType: 'audio/wav'
    };

    // Upload to S3
    await s3.upload(params).promise();

    return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/generated_audio/${index}.wav`;
};

// API endpoint to generate sound
app.post('/generate-sound', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
        const audioFilePath = await generateAudioFromPrompt(prompt, Date.now());
        res.json({ audioFilePath });
    } catch (error) {
        res.status(500).json({ error: 'Error generating audio' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
