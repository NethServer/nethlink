# NethLink

![Nethlink-logo](https://github.com/user-attachments/assets/a1b04e4f-5858-48d5-b097-61949e74cea1)

![Homebrew Cask Version](https://img.shields.io/homebrew/cask/v/nethlink?style=for-the-badge)
![WinGet Version](https://img.shields.io/winget/v/Nethesis.NethLink?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

NethLink is a tool designed to **link NethServer systems** and provide **remote access tools**. This project aims to offer a simple yet powerful user interface for managing NethServer systems more efficiently.

## 🔧 Installation

### macOS (Homebrew)

To install NethLink on macOS, use **Homebrew**:

```bash
brew install --cask nethlink
```

### Windows (Winget)

For Windows, you can install NethLink via **Winget**:

```bash
winget install NethLink
```

### Linux (Manual Installation)

For Linux, you can install NethLink manually using the following steps:

1. Download the NethLink AppImage using `curl` or `wget`:

   Using `curl`:
   ```bash
   curl -L -o nethlink.AppImage https://github.com/NethServer/nethlink/releases/download/v<VERSION>/nethlink-<VERSION>.AppImage
   ```

   Using `wget`:
   ```bash
   wget https://github.com/NethServer/nethlink/releases/download/v<VERSION>/nethlink-<VERSION>.AppImage
   ```

2. Make the AppImage executable:

   ```bash
   chmod +x nethlink.AppImage
   ```

3. Run the application:

   ```bash
   ./nethlink.AppImage
   ```

This will allow you to run NethLink on your Linux machine. You can also move the `nethlink.AppImage` to a directory in your `PATH` to make it easier to run from anywhere.


## 📦 Requirements

- **macOS**: Version 10.15 (Catalina) or later.
- **Windows**: Windows 10 or later.
- **Rosetta**: Required on macOS for ARM architectures.

⚙️ Usage

1. **Launch the app**: After installation, open `NethLink.app` on macOS or the executable on Windows.
2. **Connect your NethServer**: Enter your server's hostname, your username and your password
4. **Access your server**: Once configured, you can access your NethServer with ease.

## 🛠 Contributing

NethLink is an open-source project and we welcome contributions from the community. To contribute, follow these steps:

1. **Fork the repository**.
2. **Create a branch** for your feature or bugfix (`git checkout -b feature/your-feature`).
3. **Commit your changes** (`git commit -am 'Add a new feature'`).
4. **Push** the branch (`git push origin feature/your-feature`).
5. **Open a pull request**.

## 📄 License

Distributed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

## 🤝 Contact

- **Website**: [https://github.com/NethServer/nethlink](https://github.com/NethServer/nethlink)

---

## Development

To get started with NethLink development, follow the steps below.

### Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### Development Mode

To run the application in development mode, use:

```bash
npm run dev
```

### Build the Application

To build the application for different platforms:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

### Release Versions

To release a new version of the application, use the following commands:

```bash
# For major release
npm run publish:major

# For minor release
npm run publish:minor

# For patch release
npm run publish:patch
```

## ⚙️ Env Variables

Use the following environment variables for testing purposes:

> `DEV=true`  
> Runs the app in development mode.

> `INSTANCE=<number_of_the_instance>`  
> Enables multiple instances of the process. Use this function with caution, as it can cause issues. This is only for testing purposes. When this variable is set, a new `user_data_<instance_number>.json` is created and the instance only changes its related file.

## 🗂 User Data Folders

The user data folders for different operating systems are as follows:

- **Windows**: `%APPDATA%/nethlink/`
- **Linux**: `~/.config/nethlink/`
- **macOS**: `~/Library/Application Support/nethlink/`

There are two files: `user_data.json` and `available_users.json`. The first file contains the data of the currently logged-in user, while the second contains data for all users who have logged in at least once on the device.
