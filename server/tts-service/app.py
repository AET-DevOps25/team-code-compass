from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
from gtts import gTTS
import os

app = FastAPI()

@app.post("/tts")
def tts_from_markdown(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith('.md'):
        raise HTTPException(status_code=400, detail="Only .md files are accepted.")
    # Dosyayı oku
    contents = file.file.read().decode("utf-8")
    # TTS ile mp3'e çevir
    tts = gTTS(contents, lang='en')
    with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tts.save(tmp.name)
        tmp_path = tmp.name
    # Yanıt olarak mp3 dosyasını döndür
    background_tasks.add_task(os.remove, tmp_path)
    return FileResponse(tmp_path, media_type="audio/mpeg", filename="output.mp3") 