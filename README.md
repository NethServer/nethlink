# neth-connector-electron

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```


1. **Creazione del certificato autofirmato con Windows:**

```powershell

# Imposta le variabili per il nome del certificato e la password del PFX
$certName = "cert"
$pfxPassword = ConvertTo-SecureString -String "aidapt" -Force -AsPlainText
$certPath = "C:\Users\loren\Desktop\workspace\aidapt\neth-connector-electron\certification"

# Crea un nuovo certificato self-signed
$cert = New-SelfSignedCertificate -Subject $certName -CertStoreLocation "Cert:\CurrentUser\My" -KeyUsage DigitalSignature -KeyExportPolicy Exportable -HashAlgorithm SHA256

# Ottieni il percorso del certificato nel registro di sistema
$certRegistryPath = "HKCU:\SOFTWARE\Microsoft\SystemCertificates\CA\Certificates\$($cert.Thumbprint)"

# Esporta il certificato come file PFX
Export-PfxCertificate -Cert $certRegistryPath -FilePath "$certPath\$certName.pfx" -Password $pfxPassword

