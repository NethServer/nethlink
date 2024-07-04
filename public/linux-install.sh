#!/bin/bash

# make binary executable
chmod +x nethlink-*.AppImage
\mv nethlink-*.AppImage ~/.local/bin/nethlink

# extract .desktop file and set Exec path
nethlink --appimage-extract
sed -i "s#Exec=AppRun --no-sandbox %U#Exec=/home/$USER/.local/bin/nethlink --no-sandbox %U#g" squashfs-root/nethlink.desktop
\cp squashfs-root/nethlink.desktop ~/.local/share/applications/

# make .desktop file executable
chmod +x ~/.local/share/applications/nethlink.desktop

# clean up
rm -rf squashfs-root/
