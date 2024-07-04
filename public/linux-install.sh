#!/bin/bash

# make binary executable
echo "Make nethlink binary executable..."
chmod +x nethlink-*.AppImage

echo "Move it to ~/.local/bin/..."
\mv nethlink-*.AppImage ~/.local/bin/nethlink

# extract .desktop file and set Exec path
echo "Create nethlink.desktop in ~/.local/share/applications/..."
nethlink --appimage-extract > /dev/null
sed -i "s#Exec=AppRun --no-sandbox %U#Exec=/home/$USER/.local/bin/nethlink --no-sandbox %U#g" squashfs-root/nethlink.desktop
\cp squashfs-root/nethlink.desktop ~/.local/share/applications/

# make .desktop file executable
echo "Make nethlink.desktop executable..."
chmod +x ~/.local/share/applications/nethlink.desktop

# clean up
echo "Clean up installation files..."
rm -rf squashfs-root/

echo "Installation done!"
