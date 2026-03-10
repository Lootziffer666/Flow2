@echo off
REM ============================================================
REM  FLOW Normalizer – Build-Skript (Windows)
REM ============================================================
REM
REM  Voraussetzungen:
REM    - .NET 8 SDK installiert  (https://dotnet.microsoft.com/download/dotnet/8.0)
REM    - node.js im PATH         (https://nodejs.org)
REM
REM  Nutzung:
REM    build.bat              Kompiliert Debug-Build
REM    build.bat release      Kompiliert Release-Build
REM    build.bat publish      Erstellt eigenstaendige EXE (Single-File, self-contained)
REM
REM  Ausgabe:
REM    Debug/Release:   bin\Debug\net8.0-windows\win-x64\
REM    Publish:         publish\
REM ============================================================

setlocal

set CONFIG=Debug
if /I "%~1"=="release" set CONFIG=Release
if /I "%~1"=="publish" goto :publish

echo.
echo [FLOW] Building %CONFIG% ...
dotnet build FlowNormalizer.csproj -c %CONFIG%
if errorlevel 1 (
    echo [FLOW] Build fehlgeschlagen.
    exit /b 1
)
echo [FLOW] Build erfolgreich: bin\%CONFIG%\net8.0-windows\win-x64\
goto :eof

:publish
echo.
echo [FLOW] Publishing self-contained Single-File EXE ...
dotnet publish FlowNormalizer.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish
if errorlevel 1 (
    echo [FLOW] Publish fehlgeschlagen.
    exit /b 1
)
echo.
echo [FLOW] Fertig! Ausgabe in: publish\
echo [FLOW] Inhalt:
dir /b publish\
echo.
echo [FLOW] Starten mit: publish\FLOW_Normalizer.exe
