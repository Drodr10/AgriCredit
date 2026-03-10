from fastapi import APIRouter, Depends, Request, HTTPException, Body, UploadFile, File
from elevenlabs.client import ElevenLabs
import base64
import io
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# We'll attach client to app state in main.py, but we need text to speech functionality
class VoiceRequest(BaseModel):
    text: str
    context: str  # "account", "inputs", "results", "welcome"
    lang: str = "hi"

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/set_language")
async def set_language(lang: str, request: Request):
    request.app.state.lang = lang
    voices = {"hi": "नमस्ते!", "pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ!", "en": "Hello!"}
    return {"status": "ok", "greeting": voices.get(lang, "Hello!")}

@router.post("/tts")
async def generate_tts(voice_req: VoiceRequest, request: Request):
    # Translate by context
    translations = {
        "welcome": {
            "hi": "आपका स्वागत है! भाषा चुनें।",
            "pa": "ਜੀ ਆਇਆਂ ਨੂੰ! ਭਾਸ਼ਾ ਚੁਣੋ।",
            "en": "Welcome! Choose your language."
        },
        "account": {
            "hi": {
                "name": "खेत का नाम दर्ज करें", 
                "phone": "फोन नंबर", 
                "next": "आगे बढ़ें", 
                "district": "राज्य और जिला दर्ज करें",
                "experience": "खेती का अनुभव (साल)",
                "birthday": "जन्मदिन",
                "id": "आधार कार्ड नंबर",
                "add_farm": "नया खेत जोड़ें",
                "all_reports": "सभी रिपोर्ट देखें"
            },
            "pa": {
                "name": "ਖੇਤ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ", 
                "phone": "ਫੋਨ ਨੰਬਰ", 
                "next": "ਅੱਗੇ ਵਧੋ", 
                "district": "ਰਾਜ ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ",
                "experience": "ਖੇਤੀਬਾੜੀ ਦਾ ਤਜਰਬਾ (ਸਾਲ)",
                "birthday": "ਜਨਮਦਿਨ",
                "id": "ਆਧਾਰ ਕਾਰਡ ਨੰਬਰ",
                "add_farm": "ਨਵਾਂ ਖੇਤ ਜੋੜੋ",
                "all_reports": "ਸਾਰੀਆਂ ਰਿਪੋਰਟਾਂ"
            },
            "en": {
                "name": "Enter Farm Nickname", 
                "phone": "Phone number", 
                "next": "Continue", 
                "district": "Enter State and District",
                "experience": "Years of Farming Experience",
                "birthday": "Birthday",
                "id": "Aadhaar Card Number",
                "add_farm": "Add New Farm",
                "all_reports": "All Reports"
            }
        },
        "inputs": {
            "hi": {
                "crop": "फसल चुनें: चावल, गेहूं", 
                "district": "जिला चुनें", 
                "loan": "लोन राशि दर्ज करें", 
                "soil": "मिट्टी का प्रकार चुनें: भूरी, काली, लाल या जलोढ़", 
                "irrigation": "सिंचाई का प्रकार", 
                "machinery": "मशीनरी का प्रकार",
                "scale": "खेत का आकार हेक्टेयर में",
                "season": "मौसम चुनें: खरीफ या रबी",
                "purpose": "लोन का उद्देश्य",
                "insurance": "फसल बीमा",
                "apply": "रिपोर्ट के लिए आवेदन करें"
            },
            "pa": {
                "crop": "ਫਸਲ ਚੁਣੋ", 
                "district": "ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ", 
                "loan": "ਲੋਨ ਰਕਮ ਦਰਜ ਕਰੋ", 
                "soil": "ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਚੁਣੋ", 
                "irrigation": "ਸਿੰਚਾਈ", 
                "machinery": "ਮਸ਼ੀਨਰੀ",
                "scale": "ਖੇਤ ਦਾ ਆਕਾਰ (ਹੈਕਟੇਅਰ)",
                "season": "ਮੌਸਮ ਚੁਣੋ",
                "purpose": "ਲੋਨ ਦਾ ਉਦੇਸ਼",
                "insurance": "ਫਸਲ ਬੀਮਾ",
                "apply": "ਰਿਪੋਰਟ ਲਈ ਅਪਲਾਈ ਕਰੋ"
            },
            "en": {
                "crop": "Select crop", "district": "Select district", "loan": "Loan amount", "soil": "Soil Composition", "irrigation": "Irrigation Strategy", "machinery": "Machinery and Labor"
            }
        },
        "results": {
            "hi": {
                "low": "कम जोखिम! यह रिपोर्ट आपकी शर्तों के आधार पर एक मजबूत प्रोफाइल दर्शाती है।", "pd": "जोखिम 18%", "approve": "सत्यापन पूर्ण",
                "lender": "यह ऋणदाता रिपोर्ट है। आप 'एआई रिपोर्ट PDF' बटन दबाकर इसे प्रिंट कर सकते हैं।"
            },
            "pa": {
                "low": "ਘੱਟ ਜੋਖਮ! ਇਹ ਰਿਪੋਰਟ ਤੁਹਾਡੀਆਂ ਸ਼ਰਤਾਂ ਦੇ ਅਧਾਰ 'ਤੇ ਇੱਕ ਮਜ਼ਬੂਤ ਪ੍ਰੋਫਾਈਲ ਦਰਸਾਉਂਦੀ ਹੈ।", "pd": "ਖਤਰਾ 18%", "approve": "ਪੁਸ਼ਟੀ ਮੁਕੰਮਲ",
                "lender": "ਇਹ ਰਿਣਦਾਤਾ ਰਿਪੋਰਟ ਹੈ। ਤੁਸੀਂ 'AI ਰਿਪੋਰਟ PDF' ਬਟਨ ਦਬਾ ਕੇ ਇਸਨੂੰ ਪ੍ਰਿੰਟ ਕਰ ਸਕਦੇ ਹੋ।"
            },
            "en": {
                "low": "Low risk profile detected based on current terms and historical data.", "pd": "PD 18%", "approve": "Verification Complete",
                "lender": "This is the lender report. You can print it out by pressing the button for AI Report PDF."
            }
        }
    }
    
    # Try to find specific translation or fall back to text
    translated = voice_req.text
    context_dict = translations.get(voice_req.context)
    if context_dict:
        lang_dict = context_dict.get(voice_req.lang)
        if lang_dict:
            # Check if text is a key in the specific context/lang dictionary
            if isinstance(lang_dict, dict):
                # We need to map the English label to the translation key
                # Simple mapping based on text content for now
                text_lower = voice_req.text.lower()
                if "name" in text_lower or "nickname" in text_lower: translated = lang_dict.get("name", voice_req.text)
                elif "phone" in text_lower: translated = lang_dict.get("phone", voice_req.text)
                elif "district" in text_lower or "state" in text_lower: translated = lang_dict.get("district", voice_req.text)
                elif "experience" in text_lower: translated = lang_dict.get("experience", voice_req.text)
                elif "birthday" in text_lower: translated = lang_dict.get("birthday", voice_req.text)
                elif "aadhaar" in text_lower or "national id" in text_lower: translated = lang_dict.get("id", voice_req.text)
                elif "add new farm" in text_lower: translated = lang_dict.get("add_farm", voice_req.text)
                elif "all reports" in text_lower or "view reports" in text_lower: translated = lang_dict.get("all_reports", voice_req.text)
                elif "crop" in text_lower or "फसल" in voice_req.text: translated = lang_dict.get("crop", voice_req.text)
                elif "soil" in text_lower: translated = lang_dict.get("soil", voice_req.text)
                elif "irrigat" in text_lower: translated = lang_dict.get("irrigation", voice_req.text)
                elif "machin" in text_lower or "labor" in text_lower: translated = lang_dict.get("machinery", voice_req.text)
                elif "scale" in text_lower or "hectare" in text_lower: translated = lang_dict.get("scale", voice_req.text)
                elif "season" in text_lower: translated = lang_dict.get("season", voice_req.text)
                elif "amount" in text_lower or "loan amount" in text_lower: translated = lang_dict.get("loan", voice_req.text)
                elif "purpose" in text_lower: translated = lang_dict.get("purpose", voice_req.text)
                elif "insur" in text_lower: translated = lang_dict.get("insurance", voice_req.text)
                elif ("report" in text_lower and ("new" in text_lower or "apply" in text_lower)) or "apply for credit" in text_lower: translated = lang_dict.get("apply", voice_req.text)
                elif "lender" in text_lower: translated = lang_dict.get("lender", voice_req.text)
            elif isinstance(lang_dict, str):
                translated = lang_dict # for welcome
            
    # For full dynamic results report (ML analysis results often pass raw text)
    # Only use original text if we didn't find a mapping in the translations dict above
    if translated == voice_req.text and voice_req.context == "results":
        # Keep original text for results if no keyword mapping matched
        translated = voice_req.text
    
    # ElevenLabs TTS
    voices = {
        "hi": "XrExE9yKIg1WjnnlVkGX", # Matilda
        "pa": "pNInz6obpgDQGcFmaJgB", # Adam
        "en": "21m00Tcm4TlvDq8ikWAM"  # Rachel
    }
    voice_id = voices.get(voice_req.lang, "21m00Tcm4TlvDq8ikWAM")
    model_id = "eleven_multilingual_v2"
    
    try:
        client = request.app.state.voice_client
        if client is None:
            raise RuntimeError("ElevenLabs client is not configured")

        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            text=translated,
            model_id=model_id,
            output_format="mp3_22050_32"
        )
        
        # Accumulate the audio chunks
        audio = b""
        for chunk in audio_generator:
            if chunk is not None:
                audio += chunk
                
        return {
            "audio_b64": base64.b64encode(audio).decode(),
            "translated_text": translated,
            "lang": voice_req.lang
        }
    except Exception as e:
        print(f"TTS Error: {e}")
        return {
            "error": str(e),
            "audio_b64": "",
            "translated_text": translated,
            "lang": voice_req.lang
        }

@router.post("/stt")
async def process_stt(request: Request, file: UploadFile = File(...)):
    """Receives an audio blob from the frontend and sends it to ElevenLabs STT"""
    try:
        client = request.app.state.voice_client
        
        # Read the file contents into memory
        audio_content = await file.read()
        audio_io = io.BytesIO(audio_content)
        # Give it a name so the SDK knows what it is (doesn't matter what)
        audio_io.name = "audio.webm"
        
        # The transcription endpoint requires a generic bytes stream
        text = client.speech_to_text.convert(
            file=audio_io,
            model_id="scribe_v1", # The standard ElevenLabs STT model
            tag_audio_events=False
        )
        
        return {"transcript": text.text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))