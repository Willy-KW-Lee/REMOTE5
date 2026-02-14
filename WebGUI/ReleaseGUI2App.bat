rd /S /Q ..\WinFormsApp\bin\Debug\net10.0-windows\gui
%SYSTEMROOT%\System32\xcopy build\* ..\WinFormsApp\bin\Debug\net10.0-windows\gui\
%SYSTEMROOT%\System32\xcopy /S build\inc\* ..\WinFormsApp\bin\Debug\net10.0-windows\gui\inc\
%SYSTEMROOT%\System32\xcopy /S build\static\* ..\WinFormsApp\bin\Debug\net10.0-windows\gui\static\

rd /S /Q ..\WinFormsApp\bin\Release\net10.0-windows\gui
%SYSTEMROOT%\System32\xcopy build\* ..\WinFormsApp\bin\Release\net10.0-windows\gui\
%SYSTEMROOT%\System32\xcopy /S build\inc\* ..\WinFormsApp\bin\Release\net10.0-windows\gui\inc\
%SYSTEMROOT%\System32\xcopy /S build\static\* ..\WinFormsApp\bin\Release\net10.0-windows\gui\static\

pause