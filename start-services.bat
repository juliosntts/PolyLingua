@echo off
echo Iniciando os servicos do PolyLingua...

echo Verifique se o Docker esta em execucao antes de continuar!

echo 1. Iniciando o LibreTranslate (pode demorar alguns minutos na primeira execucao)...
docker-compose down 2>nul
docker-compose up -d

echo 2. Iniciando o backend Python...
cd backend
start cmd /k ..\.venv\Scripts\activate.bat ^& python app.py
cd ..

echo 3. Iniciando o frontend...
start cmd /k npm start

echo Todos os servicos foram iniciados!
echo - LibreTranslate: http://localhost:5002
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo Para parar o LibreTranslate, execute: docker-compose down 