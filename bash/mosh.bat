SET mosh=%~1
SET output=%~2
START binaries/ffmpeg.exe -i "%mosh%" -vcodec libxvid -qscale 1 -g 60 -me_method epzs -bf 0 -mbd 0 -acodec copy "%mosh%-nokeys.avi"
CALL datamosh "%mosh%-nokeys.avi" -o "%mosh%-datamosh.avi"
CALL moshy -m bake -i "%mosh%-datamosh.avi" -o "%mosh%-moshy.avi"
START binaries/ffmpeg.exe -i "%mosh%-moshy.avi" -strict -2 "%output%"
DEL "%mosh%-nokeys.avi"
DEL "%mosh%-datamosh.avi"
DEL "%mosh%-moshy.avi"