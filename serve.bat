@echo off
rem Lance un petit serveur local pour consulter les cours (index.html) sans erreur
rem de chargement des pages. Aucune installation requise : a defaut de PHP, Node,
rem Python ou Ruby, le script utilise PowerShell (present dans Windows).
rem Usage :  serve.bat [port]     (port par defaut : 8000)
rem Puis ouvrir http://localhost:8000/ dans le navigateur. Arret : Ctrl+C.

cd /d "%~dp0"
set "PORT=%~1"
if "%PORT%"=="" set "PORT=8000"

echo Cours AMANA : http://localhost:%PORT%/   (Ctrl+C pour arreter)

where php >nul 2>nul && ( php -S localhost:%PORT% -t . & goto :eof )
where py >nul 2>nul && ( py -3 -m http.server %PORT% --bind 127.0.0.1 & goto :eof )
where python >nul 2>nul && ( python -m http.server %PORT% --bind 127.0.0.1 & goto :eof )
where npx >nul 2>nul && ( call npx --yes http-server . -p %PORT% & goto :eof )
where ruby >nul 2>nul && ( ruby -run -e httpd . -p %PORT% & goto :eof )

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%
